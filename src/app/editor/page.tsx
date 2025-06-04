"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType, type EditorSaveStatus } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Type, Image as ImageIconLucide, Square as ButtonIconElement, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import type { IWebsite, IWebsiteVersion, IWebsiteVersionPage } from '@/models/Website'; // Removed IPageComponent from here
import type { IPageComponent } from '@/models/PageComponent'; // Use the dedicated model
import type { ITemplate } from '@/models/Template';
import { useToast } from '@/hooks/use-toast';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';
import mongoose from 'mongoose';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getComponentConfig } from '@/components/editor/componentRegistry';


interface SelectedElementData extends IPageComponent {
  pageIndex: number; 
  elementIndex: number;
}

const defaultInitialPage: IWebsiteVersionPage = {
  _id: new mongoose.Types.ObjectId().toString(), 
  name: "Home",
  slug: "/",
  elements: [],
  seoTitle: "Home Page",
  seoDescription: "Welcome to your new site!",
};

function EditorPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const websiteIdFromQuery = searchParams.get('websiteId');

  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [websiteData, setWebsiteData] = useState<IWebsite | null>(null); 
  
  const [currentPages, setCurrentPages] = useState<IWebsiteVersionPage[]>([JSON.parse(JSON.stringify(defaultInitialPage))]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(true);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const [editorSaveStatus, setEditorSaveStatus] = useState<EditorSaveStatus>('idle');
  const [pageToDeleteIndex, setPageToDeleteIndex] = useState<number | null>(null);


  const loadWebsiteData = useCallback(async (id: string) => {
    setIsLoadingWebsite(true);
    setEditorSaveStatus('idle');
    try {
      const result = await getWebsiteEditorData(id);
      if (result.error) {
        toast({ title: "Error Loading Website", description: result.error, variant: "destructive" });
        setWebsiteData(null);
        setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
        setActivePageIndex(0);
        setSelectedElement(null);
      } else if (result.website && result.currentVersion) {
        setWebsiteData(result.website);
        const sanitizedPages = result.currentVersion.pages.map(p => ({
          ...p,
          _id: (p._id || new mongoose.Types.ObjectId()).toString(),
          elements: p.elements.map(el => ({
            ...el,
            _id: (el._id || new mongoose.Types.ObjectId()).toString(),
          }))
        })) as IWebsiteVersionPage[];
        
        setCurrentPages(sanitizedPages.length > 0 ? sanitizedPages : [JSON.parse(JSON.stringify(defaultInitialPage))]);
        setActivePageIndex(0);
        setSelectedElement(null);
        setEditorSaveStatus('saved'); 
      } else if (result.website) { 
        setWebsiteData(result.website);
        setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
        setActivePageIndex(0);
        setSelectedElement(null);
        setEditorSaveStatus('unsaved_changes'); 
      }
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to load website: ${err.message}`, variant: "destructive" });
      setWebsiteData(null);
      setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
      setActivePageIndex(0);
      setSelectedElement(null);
    } finally {
      setIsLoadingWebsite(false);
    }
  }, [toast]);

  useEffect(() => {
    if (websiteIdFromQuery) {
      if (websiteId !== websiteIdFromQuery) { 
        setWebsiteId(websiteIdFromQuery);
        loadWebsiteData(websiteIdFromQuery);
      }
    } else {
      setIsLoadingWebsite(false); 
      setWebsiteData(null);
      setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
      setActivePageIndex(0);
      setSelectedElement(null);
    }
  }, [websiteIdFromQuery, websiteId, loadWebsiteData]);

  const handleElementSelect = useCallback((elementId: string, pageIndex: number) => {
    const page = currentPages[pageIndex];
    if (page) {
      const elementIndex = page.elements.findIndex(el => (el._id as string) === elementId);
      if (elementIndex !== -1) {
        setSelectedElement({ ...(page.elements[elementIndex] as IPageComponent), pageIndex, elementIndex });
      } else {
        setSelectedElement(null);
      }
    }
  }, [currentPages]);
  
  const handlePropertyChange = (propertyName: string, value: any, isPageSetting: boolean = false) => {
    setCurrentPages(prevPages => {
      const newPages = JSON.parse(JSON.stringify(prevPages)); // Deep clone for immutability
      if (isPageSetting && newPages[activePageIndex]) {
        (newPages[activePageIndex] as any)[propertyName] = value;
      } else if (selectedElement && newPages[selectedElement.pageIndex]) {
        const pageToUpdate = newPages[selectedElement.pageIndex];
        const elementToUpdate = pageToUpdate.elements[selectedElement.elementIndex];
        if (elementToUpdate) {
          if (propertyName === 'config' && typeof value === 'object') { // Handle full config object update
            elementToUpdate.config = { ...elementToUpdate.config, ...value };
          } else { // Handle individual config property update
            elementToUpdate.config = { ...elementToUpdate.config, [propertyName]: value };
          }
          // Update selectedElement state immediately for inspector to reflect change
          setSelectedElement(prevSel => prevSel ? {
            ...prevSel,
            config: { ...elementToUpdate.config }
          } : null);
        }
      }
      return newPages;
    });
    setEditorSaveStatus('unsaved_changes');
  };
  
  const getEditorContentForSave = useCallback((): SaveWebsiteContentInput['pages'] => {
    return currentPages.map(page => ({
        _id: page._id as string, 
        name: page.name,
        slug: page.slug,
        elements: page.elements.map(el => ({ 
            _id: el._id as string, 
            type: el.type, 
            config: el.config, 
            order: el.order,
            label: el.label, 
        })),
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
    }));
  }, [currentPages]);

  const handleApplyTemplate = useCallback((template: ITemplate) => {
    if (template.pages && template.pages.length > 0) {
      const newPagesWithIds = template.pages.map(p => ({
        ...p,
        _id: new mongoose.Types.ObjectId().toString(), 
        elements: p.elements.map(el => ({ ...el, _id: new mongoose.Types.ObjectId().toString() })) 
      })) as IWebsiteVersionPage[];
      setCurrentPages(newPagesWithIds);
      setActivePageIndex(0);
      setSelectedElement(null); 
      setEditorSaveStatus('unsaved_changes'); 
      toast({ title: "Template Applied", description: `"${template.name}" has been applied. Save your changes to persist.` });
    } else {
      toast({ title: "Empty Template", description: "Selected template has no content.", variant: "destructive" });
    }
    setIsTemplateGalleryModalOpen(false);
  }, [toast]);
  
  const handleEditorSaveChanges = async () => {
    if (!websiteId) {
      toast({ title: "Error", description: "No website ID available to save changes.", variant: "destructive" });
      return;
    }
    setEditorSaveStatus('saving');
    const contentToSave: SaveWebsiteContentInput = {
      websiteId: websiteId,
      pages: getEditorContentForSave(),
      // globalSettings: {} // Add global settings if implemented
    };

    try {
      const result = await saveWebsiteContent(contentToSave);
      if (result.success && result.website) {
        setEditorSaveStatus('saved');
        setWebsiteData(result.website); 
        if (result.versionId && result.website.currentVersionId?.toString() === result.versionId) {
            await loadWebsiteData(websiteId); // Reload to get DB-assigned IDs for pages/elements if necessary
        }
        toast({ title: "Changes Saved!", description: "Your website content has been updated." });
      } else {
        setEditorSaveStatus('error');
        toast({ title: "Save Failed", description: result.error || "Could not save changes.", variant: "destructive" });
      }
    } catch (error: any) {
      setEditorSaveStatus('error');
      toast({ title: "Save Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleAddPage = () => {
    const newPageName = `Page ${currentPages.length + 1}`;
    const newPageSlug = `/page-${currentPages.length + 1}`; 
    const newPage: IWebsiteVersionPage = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: newPageName,
      slug: newPageSlug,
      elements: [],
      seoTitle: newPageName,
      seoDescription: `Description for ${newPageName}`,
    };
    setCurrentPages(prev => [...prev, newPage]);
    setActivePageIndex(currentPages.length); 
    setSelectedElement(null);
    setEditorSaveStatus('unsaved_changes');
    toast({ title: "Page Added", description: `"${newPageName}" created.`});
  };

  const handleDeletePage = () => {
    if (pageToDeleteIndex === null || currentPages.length <= 1) {
      toast({ title: "Cannot Delete Page", description: "You must have at least one page.", variant: "destructive" });
      setPageToDeleteIndex(null);
      return;
    }
    const pageName = currentPages[pageToDeleteIndex].name;
    const newPages = currentPages.filter((_, index) => index !== pageToDeleteIndex);
    setCurrentPages(newPages);
    
    // Adjust activePageIndex
    if (activePageIndex === pageToDeleteIndex) {
      setActivePageIndex(Math.max(0, pageToDeleteIndex -1));
    } else if (activePageIndex > pageToDeleteIndex) {
      setActivePageIndex(activePageIndex - 1);
    }
    // else activePageIndex remains the same

    setSelectedElement(null);
    setEditorSaveStatus('unsaved_changes');
    toast({ title: "Page Deleted", description: `"${pageName}" has been removed.`});
    setPageToDeleteIndex(null);
  };

  const renderPropertyFields = () => {
    const activePage = currentPages[activePageIndex];

    if (selectedElement && activePage && activePage.elements[selectedElement.elementIndex]) {
      const currentElementConfig = selectedElement.config || {};
      const componentMeta = getComponentConfig(selectedElement.type);

      return (
        <>
          <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{componentMeta?.label || selectedElement.type}</strong> ({selectedElement.config?.text || selectedElement.config?.alt || selectedElement.config?.title || 'Element'})</p>
          {Object.entries(componentMeta?.defaultConfig || {}).map(([key, defaultValue]) => {
            const currentValue = currentElementConfig[key] !== undefined ? currentElementConfig[key] : defaultValue;
            
            // Basic input types based on defaultValue type or key name
            if (key === 'text' || key === 'htmlContent' || key === 'subtitle' || key === 'description' || key === 'copyrightText') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Textarea id={`prop-${key}`} value={currentValue || ""} placeholder={`Enter ${key}`} className="text-xs" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                </div>
              );
            } else if (key === 'src' || key === 'link' || key === 'buttonLink' || key === 'backgroundImage' || key === 'liveDemoUrl' || key === 'previewImageUrl') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input type="url" id={`prop-${key}`} value={currentValue || ""} placeholder="https://example.com" className="text-xs" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                   {key === 'src' && currentValue && (<div className="mt-1"><img src={currentValue as string} alt={'Preview'} className="rounded-md max-w-full h-auto border" data-ai-hint={currentElementConfig.dataAiHint as string || 'placeholder image'}/></div>)}
                </div>
              );
            } else if (key === 'color' || key === 'backgroundColor') {
                return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input type="color" id={`prop-${key}`} value={currentValue || "#000000"} className="text-xs h-8 w-full" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                  </div>
                );
            } else if (key === 'level' && selectedElement.type === 'heading') {
               return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor="headingLevel" className="text-xs">Level (H1-H6)</Label>
                  <Select value={currentValue || "h2"} onValueChange={(value) => handlePropertyChange(key, value)}>
                    <SelectTrigger id="headingLevel" className="w-full text-xs bg-input"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent><SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem></SelectContent>
                  </Select>
                </div>
              );
            } else if (key === 'style' && selectedElement.type === 'button') {
               return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor="buttonStyle" className="text-xs">Style</Label>
                   <Select value={currentValue || "primary"} onValueChange={(value) => handlePropertyChange(key, value)}>
                    <SelectTrigger id="buttonStyle" className="w-full text-xs bg-input"><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="outline">Outline</SelectItem></SelectContent>
                  </Select>
                </div>
              );
            } else if (typeof defaultValue === 'boolean') {
              // This part is conceptual as we don't have a Switch component in the base Textarea/Input handling
              // A real implementation would use a <Switch /> component from shadcn/ui
              return (
                <div key={key} className="space-y-1 mt-2 flex items-center">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize mr-2">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input type="checkbox" id={`prop-${key}`} checked={!!currentValue} className="text-xs scale-75" onChange={(e) => handlePropertyChange(key, e.target.checked)} />
                </div>
              );
            } else if (Array.isArray(defaultValue) || (typeof defaultValue === 'object' && defaultValue !== null)) {
              return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')} (JSON)</Label>
                    <Textarea id={`prop-${key}`} value={JSON.stringify(currentValue, null, 2) || ""} placeholder={`Enter JSON for ${key}`} className="text-xs h-24" onChange={(e) => { try { handlePropertyChange(key, JSON.parse(e.target.value)); } catch (err) { /* Ignore parse error on live typing */ } }} />
                  </div>
              );
            }
            // Default input for other string/number types
            return (
              <div key={key} className="space-y-1 mt-2">
                <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                <Input type={typeof defaultValue === 'number' ? 'number' : 'text'} id={`prop-${key}`} value={currentValue || ""} placeholder={`Enter ${key}`} className="text-xs" onChange={(e) => handlePropertyChange(key, typeof defaultValue === 'number' ? parseFloat(e.target.value) : e.target.value)} />
              </div>
            );
          })}
        </>
      );
    } else if (activePage) { 
      return (
        <>
          <p className="text-sm text-muted-foreground mb-3">Page Settings: <strong>{activePage.name}</strong></p>
          <div className="space-y-2">
            <Label htmlFor="pageName" className="text-xs">Page Name</Label>
            <Input type="text" id="pageName" value={activePage.name || ""} placeholder="Home" className="text-xs" onChange={(e) => handlePropertyChange('name', e.target.value, true)} />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="pageSlug" className="text-xs">Slug (URL Path)</Label>
            <Input type="text" id="pageSlug" value={activePage.slug || ""} placeholder="/home" className="text-xs" onChange={(e) => handlePropertyChange('slug', e.target.value, true)} />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="seoTitle" className="text-xs">SEO Title</Label>
            <Input type="text" id="seoTitle" value={activePage.seoTitle || ""} placeholder="Page Title for SEO" className="text-xs" onChange={(e) => handlePropertyChange('seoTitle', e.target.value, true)} />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="seoDescription" className="text-xs">SEO Description</Label>
            <Textarea id="seoDescription" value={activePage.seoDescription || ""} placeholder="Page description for SEO" className="text-xs" rows={3} onChange={(e) => handlePropertyChange('seoDescription', e.target.value, true)} />
          </div>
        </>
      );
    }
    return <p className="text-sm text-muted-foreground">Select an element or manage page settings.</p>;
  };

  if (isLoadingWebsite) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading editor...</p>
      </div>
    );
  }
  if (!websiteId && !isLoadingWebsite) {
     return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center p-8">
        <Card className="max-w-md text-center"><CardHeader><CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2"/>Error: Website Not Specified</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">No website ID was provided. Select a website from your dashboard.</p><Button asChild className="mt-6"><a href="/dashboard">Go to Dashboard</a></Button></CardContent></Card>
      </div>
    );
  }

  const renderEditorSaveStatus = () => {
    if (!websiteId) return null;
    let Icon = CheckCircle; let text = "Up to date"; let color = "text-muted-foreground";
    switch (editorSaveStatus) {
      case 'saving': Icon = Loader2; text = "Saving..."; color = "text-muted-foreground animate-spin"; break;
      case 'saved': Icon = CheckCircle; text = "Saved"; color = "text-green-600"; break;
      case 'error': Icon = AlertCircleIcon; text = "Error Saving"; color = "text-destructive"; break;
      case 'unsaved_changes': Icon = AlertCircleIcon; text = "Unsaved Changes"; color = "text-amber-600"; break;
    }
    return <div className={`flex items-center text-xs ${color} mr-2`}><Icon className={`h-4 w-4 mr-1 ${editorSaveStatus === 'saving' ? 'animate-spin' : ''}`} />{text}</div>;
  };
  
  const currentEditorPage = currentPages[activePageIndex] || defaultInitialPage;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} websiteId={websiteId} editorSaveStatus={editorSaveStatus} onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)} onOpenTemplateGalleryModal={() => setIsTemplateGalleryModalOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <ComponentLibrarySidebar />
        <main className="flex-1 flex flex-col p-1 md:p-4 overflow-hidden bg-muted/30">
          <div className="flex justify-between items-center p-2 border-b bg-card mb-2 gap-3">
            <Tabs value={activePageIndex.toString()} onValueChange={(value) => {setActivePageIndex(parseInt(value)); setSelectedElement(null);}} className="max-w-[calc(100%-200px)] overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto">
                {currentPages.map((page, index) => (
                  <TabsTrigger key={page._id as string || index} value={index.toString()} className="text-xs px-2 py-1.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary">
                    {page.name}
                    {currentPages.length > 1 && (
                         <AlertDialogTrigger
                            asChild
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPageToDeleteIndex(index); }} // Prevent tab activation
                         >
                            <button
                                className="ml-1.5 p-0.5 rounded hover:bg-destructive/10 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                aria-label={`Delete page ${page.name}`}
                                title={`Delete page ${page.name}`}
                            >
                                <Trash2 className="h-3 w-3 text-destructive"/>
                            </button>
                        </AlertDialogTrigger>
                    )}
                  </TabsTrigger>
                ))}
                <Button variant="ghost" size="sm" onClick={handleAddPage} className="text-xs h-auto px-2 py-1.5 ml-1"><FilePlus className="mr-1 h-3.5 w-3.5"/>Add Page</Button>
              </TabsList>
            </Tabs>
            <div className="flex items-center">
                {renderEditorSaveStatus()}
                <Button size="sm" onClick={handleEditorSaveChanges} disabled={editorSaveStatus === 'saving' || editorSaveStatus === 'saved' || editorSaveStatus === 'idle'}><Save className="mr-2 h-4 w-4" />Save Site</Button>
            </div>
          </div>
          <CanvasEditor devicePreview={currentDevice} page={currentEditorPage} pageIndex={activePageIndex} onElementSelect={handleElementSelect} onDropComponent={(componentType, targetOrder) => {
                setCurrentPages(prevPages => {
                    const newPages = JSON.parse(JSON.stringify(prevPages));
                    const pageToUpdate = newPages[activePageIndex];
                    if (pageToUpdate) {
                        const componentConf = getComponentConfig(componentType);
                        const newElement: IPageComponent = { 
                            _id: new mongoose.Types.ObjectId().toString(), 
                            type: componentType, 
                            label: componentConf?.label,
                            config: componentConf?.defaultConfig || { text: `New ${componentType}` }, 
                            order: targetOrder !== undefined ? targetOrder : pageToUpdate.elements.length 
                        };
                        if (targetOrder !== undefined) {
                             pageToUpdate.elements.splice(targetOrder, 0, newElement);
                             for(let i = targetOrder; i < pageToUpdate.elements.length; i++) pageToUpdate.elements[i].order = i; 
                        } else { pageToUpdate.elements.push(newElement); }
                    } return newPages;
                });
                setEditorSaveStatus('unsaved_changes');
                toast({ title: "Component Added", description: `${getComponentConfig(componentType)?.label || componentType} added to page ${currentEditorPage?.name || activePageIndex + 1}.` });
            }} />
        </main>
        <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
          <Card className="flex-1"><CardHeader><CardTitle className="font-headline text-lg flex items-center">{selectedElement ? <><MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />{(getComponentConfig(selectedElement.type)?.label || selectedElement.type)} Properties</> : <><Settings className="w-5 h-5 mr-2 text-primary" />Page Settings</>}</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">{renderPropertyFields()}</div>{selectedElement && <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)} className="mt-4">Deselect Element</Button>}</CardContent></Card>
        </aside>
      </div>
      {websiteId && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen} currentDesignData={getEditorContentForSave()}/>}
      <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} onApplyTemplate={handleApplyTemplate}/>
      <AlertDialog open={pageToDeleteIndex !== null} onOpenChange={(open) => !open && setPageToDeleteIndex(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete Page?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete page "{currentPages[pageToDeleteIndex as number]?.name || ''}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel onClick={() => setPageToDeleteIndex(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeletePage} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EditorPage() {
  return (<Suspense fallback={<div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading editor...</p></div>}><EditorPageComponent /></Suspense>);
}