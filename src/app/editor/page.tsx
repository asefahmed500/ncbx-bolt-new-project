
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Type, Image as ImageIcon, Square as ButtonIconElement, BarChart2, UploadCloud, Crop, Sparkles, Box, Columns as ColumnsIcon, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import type { IWebsite, IWebsiteVersion, IWebsiteVersionPage, IPageComponent } from '@/models/Website';
import type { ITemplate } from '@/models/Template';
import { useToast } from '@/hooks/use-toast';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';
import mongoose from 'mongoose';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


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

type EditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved_changes';


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
      } else if (result.website) {
        setWebsiteData(result.website);
        if (result.currentVersion && result.currentVersion.pages && result.currentVersion.pages.length > 0) {
          setCurrentPages(result.currentVersion.pages.map(p => ({...p, _id: p._id || new mongoose.Types.ObjectId().toString() } as IWebsiteVersionPage)));
        } else {
          setCurrentPages([{ ...defaultInitialPage, _id: new mongoose.Types.ObjectId().toString() }]);
        }
        setActivePageIndex(0);
        setEditorSaveStatus('saved'); 
      }
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to load website: ${err.message}`, variant: "destructive" });
    } finally {
      setIsLoadingWebsite(false);
    }
  }, [toast]);

  useEffect(() => {
    if (websiteIdFromQuery) {
      setWebsiteId(websiteIdFromQuery);
      loadWebsiteData(websiteIdFromQuery);
    } else {
      setIsLoadingWebsite(false); 
    }
  }, [websiteIdFromQuery, loadWebsiteData]);

  const handleElementSelect = useCallback((elementId: string, pageIndex: number) => {
    const page = currentPages[pageIndex];
    if (page) {
      const elementIndex = page.elements.findIndex(el => (el._id as unknown as string) === elementId);
      if (elementIndex !== -1) {
        setSelectedElement({ ...page.elements[elementIndex], pageIndex, elementIndex });
      } else {
        setSelectedElement(null);
      }
    }
  }, [currentPages]);
  
  const handlePropertyChange = (propertyName: string, value: any, isPageSetting: boolean = false) => {
    setCurrentPages(prevPages => {
      const newPages = JSON.parse(JSON.stringify(prevPages)); // Deep clone
      if (isPageSetting && newPages[activePageIndex]) {
        newPages[activePageIndex][propertyName as keyof IWebsiteVersionPage] = value;
      } else if (selectedElement && newPages[selectedElement.pageIndex]) {
        const pageToUpdate = newPages[selectedElement.pageIndex];
        const elementToUpdate = pageToUpdate.elements[selectedElement.elementIndex];
        if (elementToUpdate) {
          elementToUpdate.config = { ...elementToUpdate.config, [propertyName]: value };
          setSelectedElement(prevSel => prevSel ? {...prevSel, config: elementToUpdate.config} : null);
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
            order: el.order 
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
    };

    try {
      const result = await saveWebsiteContent(contentToSave);
      if (result.success && result.website) {
        setEditorSaveStatus('saved');
        setWebsiteData(result.website); 
        if (result.versionId && result.website.currentVersionId?.toString() === result.versionId) {
            const savedVersion = await getWebsiteEditorData(websiteId);
            if(savedVersion.currentVersion?.pages) {
                 setCurrentPages(savedVersion.currentVersion.pages.map(p => ({...p, _id: p._id || new mongoose.Types.ObjectId().toString() } as IWebsiteVersionPage)));
                 setActivePageIndex(prev => Math.min(prev, savedVersion.currentVersion!.pages.length -1)); // Ensure active page index is valid
            }
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
    setActivePageIndex(currentPages.length); // Switch to the new page
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
    setCurrentPages(prev => prev.filter((_, index) => index !== pageToDeleteIndex));
    setActivePageIndex(prev => Math.max(0, prev - (pageToDeleteIndex <= prev ? 1 : 0)));
    setEditorSaveStatus('unsaved_changes');
    toast({ title: "Page Deleted", description: `"${pageName}" has been removed.`});
    setPageToDeleteIndex(null);
  };


  const renderPropertyFields = () => {
    const activePage = currentPages[activePageIndex];

    if (selectedElement && activePage && activePage.elements[selectedElement.elementIndex]) {
      const currentElementConfig = selectedElement.config;
      switch (selectedElement.type) {
        case 'heading':
          return (
            <>
              <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{currentElementConfig?.text || 'Heading'}</strong></p>
              <div className="space-y-2">
                <Label htmlFor="textContent" className="text-xs">Text Content</Label>
                <Textarea id="textContent" value={currentElementConfig?.text || ""} placeholder="Enter heading text" className="text-xs" onChange={(e) => handlePropertyChange('text', e.target.value)} />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="fontSize" className="text-xs">Font Size (e.g., 2rem, 24px)</Label>
                <Input type="text" id="fontSize" value={currentElementConfig?.fontSize || ""} placeholder="e.g., 2rem" className="text-xs" onChange={(e) => handlePropertyChange('fontSize', e.target.value)} />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="color" className="text-xs">Text Color</Label>
                <Input type="color" id="color" value={currentElementConfig?.color || "#333333"} className="text-xs h-8 w-full" onChange={(e) => handlePropertyChange('color', e.target.value)} />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="headingLevel" className="text-xs">Level (H1-H6)</Label>
                <Select value={currentElementConfig?.level || "h2"} onValueChange={(value) => handlePropertyChange('level', value)}>
                  <SelectTrigger id="headingLevel" className="w-full text-xs bg-input"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent><SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem></SelectContent>
                </Select>
              </div>
            </>
          );
        case 'image':
          return (
            <>
              <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{currentElementConfig?.alt || 'Image'}</strong></p>
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-xs">Image Source URL</Label>
                <Input type="url" id="imageUrl" value={currentElementConfig?.src || ""} placeholder="https://placehold.co/600x400.png" className="text-xs" onChange={(e) => handlePropertyChange('src', e.target.value)} />
              </div>
              {currentElementConfig?.src && (<div className="mt-2"><img src={currentElementConfig.src as string} alt={currentElementConfig?.alt as string || 'Preview'} className="rounded-md max-w-full h-auto border" data-ai-hint="placeholder image"/></div>)}
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs" disabled><UploadCloud className="mr-2 h-3.5 w-3.5" /> Upload Image (Conceptual)</Button>
              <div className="space-y-2 mt-2">
                <Label htmlFor="altText" className="text-xs">Alt Text</Label>
                <Input type="text" id="altText" value={currentElementConfig?.alt || ""} placeholder="Descriptive text" className="text-xs" onChange={(e) => handlePropertyChange('alt', e.target.value)}/>
              </div>
            </>
          );
        case 'button':
          return (
            <>
              <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{currentElementConfig?.text || 'Button'}</strong></p>
              <div className="space-y-2">
                <Label htmlFor="buttonText" className="text-xs">Button Text</Label>
                <Input type="text" id="buttonText" value={currentElementConfig?.text || ""} placeholder="Click Me" className="text-xs" onChange={(e) => handlePropertyChange('text', e.target.value)} />
              </div>
              {/* Other button props like link, style etc. would go here */}
            </>
          );
        default:
          return (
            <>
              <p className="text-sm text-muted-foreground mb-2">Editing: <strong>{selectedElement.type}</strong></p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">{JSON.stringify(currentElementConfig, null, 2)}</pre>
            </>
          );
      }
    } else if (activePage) { // Page settings
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
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1.5 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => {e.stopPropagation(); setPageToDeleteIndex(index);}}>
                                <Trash2 className="h-3 w-3"/>
                            </Button>
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
                        const newElement: IPageComponent = { _id: new mongoose.Types.ObjectId().toString(), type: componentType, config: { text: `New ${componentType}` }, order: targetOrder !== undefined ? targetOrder : pageToUpdate.elements.length, createdAt: new Date(), updatedAt: new Date() };
                        if (targetOrder !== undefined) {
                             pageToUpdate.elements.splice(targetOrder, 0, newElement);
                             for(let i = targetOrder + 1; i < pageToUpdate.elements.length; i++) pageToUpdate.elements[i].order = i;
                        } else { pageToUpdate.elements.push(newElement); }
                    } return newPages;
                });
                setEditorSaveStatus('unsaved_changes');
                toast({ title: "Component Added", description: `${componentType} added to page ${activePageIndex + 1}.` });
            }} />
        </main>
        <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
          <Card className="flex-1"><CardHeader><CardTitle className="font-headline text-lg flex items-center">{selectedElement ? <><MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />{selectedElement.type} Properties</> : <><Settings className="w-5 h-5 mr-2 text-primary" />Page Settings</>}</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">{renderPropertyFields()}</div>{selectedElement && <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)} className="mt-4">Deselect Element</Button>}</CardContent></Card>
        </aside>
      </div>
      {websiteId && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen} currentDesignData={currentPages}/>}
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
