
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType, type EditorSaveStatus } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput, addPageToWebsite, deletePageFromWebsite, updatePageInWebsite as updatePageDetailsAction } from '@/actions/website';
import type { IWebsite, IWebsiteVersionPage } from '@/models/WebsiteVersion';
import type { IPageComponent } from '@/models/PageComponent';
import type { ITemplate } from '@/models/Template';
import { useToast } from '@/hooks/use-toast';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';
import mongoose from 'mongoose';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getComponentConfig } from '@/components/editor/componentRegistry';
import { 
  DndContext, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors,
  type DragEndEvent,
  type Active,
  type Over
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';


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
  const [activeDraggedItemType, setActiveDraggedItemType] = useState<string | null>(null);


  const loadWebsiteData = useCallback(async (id: string) => {
    setIsLoadingWebsite(true);
    setEditorSaveStatus('idle');
    setSelectedElement(null); // Deselect element when loading new website data
    try {
      const result = await getWebsiteEditorData(id);
      if (result.error) {
        toast({ title: "Error Loading Website", description: result.error, variant: "destructive" });
        setWebsiteData(null);
        setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
        setActivePageIndex(0);
      } else if (result.website) {
        setWebsiteData(result.website);
        if (result.currentVersion && result.currentVersion.pages.length > 0) {
          const sanitizedPages = result.currentVersion.pages.map(p => ({
            ...p,
            _id: (p._id || new mongoose.Types.ObjectId()).toString(),
            elements: p.elements.map(el => ({
              ...el,
              _id: (el._id || new mongoose.Types.ObjectId()).toString(),
            }))
          })) as IWebsiteVersionPage[];
          setCurrentPages(sanitizedPages);
        } else {
          setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
        }
        setActivePageIndex(0);
        setEditorSaveStatus('saved'); 
      }
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to load website: ${err.message}`, variant: "destructive" });
      setWebsiteData(null);
      setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
      setActivePageIndex(0);
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
      const newPages = JSON.parse(JSON.stringify(prevPages)); 
      const pageToUpdate = newPages[activePageIndex];
      if (pageToUpdate) {
        if (isPageSetting) {
          (pageToUpdate as any)[propertyName] = value;
        } else if (selectedElement && pageToUpdate.elements[selectedElement.elementIndex]) {
          const elementToUpdate = pageToUpdate.elements[selectedElement.elementIndex];
          if (elementToUpdate) {
            if (propertyName === 'config' && typeof value === 'object') { 
              elementToUpdate.config = { ...elementToUpdate.config, ...value };
            } else { 
              elementToUpdate.config = { ...elementToUpdate.config, [propertyName]: value };
            }
            setSelectedElement(prevSel => prevSel ? {
              ...prevSel,
              config: { ...elementToUpdate.config }
            } : null);
          }
        }
      }
      return newPages;
    });
    setEditorSaveStatus('unsaved_changes');
  };

  const handlePageDetailsChange = async (pageId: string, newName: string, newSlug: string) => {
    if (!websiteId) return;
    setEditorSaveStatus('saving');
    const pageToUpdate = currentPages.find(p => p._id === pageId);
    if (!pageToUpdate) return;

    const currentSlug = pageToUpdate.slug;
    const sanitizedSlug = newSlug.startsWith('/') ? newSlug : `/${newSlug}`;

    const updateData: Partial<IWebsiteVersionPage> = { name: newName, slug: sanitizedSlug };

    // Only call action if name or slug actually changed to avoid unnecessary versioning
    if (pageToUpdate.name !== newName || pageToUpdate.slug !== sanitizedSlug) {
      const result = await updatePageDetailsAction(websiteId, pageId, updateData);
      if (result.error) {
        toast({ title: "Error updating page", description: result.error, variant: "destructive" });
        setEditorSaveStatus('error');
      } else if (result.success && result.website && result.page) {
        toast({ title: "Page Updated!", description: `Page "${result.page.name}" details saved.` });
        // Reload website data to get the new version with updated page details
        await loadWebsiteData(websiteId);
        // Ensure the correct page remains active, potentially finding it by the new slug/id
        const updatedPageIndex = currentPages.findIndex(p => p._id === result.page?._id || p.slug === result.page?.slug);
        setActivePageIndex(updatedPageIndex !== -1 ? updatedPageIndex : 0);
        setEditorSaveStatus('saved');
      }
    } else {
      // If only local state changed but no actual diff for server, just update local and mark as saved
      setCurrentPages(prev => prev.map(p => p._id === pageId ? {...p, name: newName, slug: sanitizedSlug} : p));
      setEditorSaveStatus('saved');
    }
  };
  
  const getEditorContentForSave = useCallback((): SaveWebsiteContentInput['pages'] => {
    return currentPages.map(page => ({
        _id: page._id as string, 
        name: page.name,
        slug: page.slug,
        elements: page.elements.map((el, index) => ({ 
            _id: el._id as string, 
            type: el.type, 
            config: el.config, 
            order: index, // Ensure order is based on current array index
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
    };

    try {
      const result = await saveWebsiteContent(contentToSave);
      if (result.success && result.website && result.versionId) {
        setEditorSaveStatus('saved');
        setWebsiteData(result.website); 
        // Reload to get any DB-assigned IDs and ensure consistency
        await loadWebsiteData(websiteId); 
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

  const handleAddPage = async () => {
    if (!websiteId) {
      toast({ title: "Error", description: "Website ID is missing.", variant: "destructive" });
      return;
    }
    const newPageBaseName = "New Page";
    let newPageName = newPageBaseName;
    let counter = 1;
    while (currentPages.some(p => p.name === newPageName)) {
      newPageName = `${newPageBaseName} ${counter++}`;
    }
    
    const tempPageData = { name: newPageName, slug: `/${newPageName.toLowerCase().replace(/\s+/g, '-')}` };

    setEditorSaveStatus('saving'); // Indicate an operation is in progress
    const result = await addPageToWebsite(websiteId, tempPageData);
    if (result.error || !result.page) {
      toast({ title: "Error Adding Page", description: result.error || "Could not add page.", variant: "destructive" });
      setEditorSaveStatus('error');
    } else {
      toast({ title: "Page Added", description: `Page "${result.page.name}" created successfully.` });
      await loadWebsiteData(websiteId); // Reload to get the new version with the added page
      // Find the index of the newly added page and set it as active
      const addedPageIndex = result.website?.currentVersion?.pages.findIndex(p => p._id === result.page?._id);
      setActivePageIndex(addedPageIndex !== -1 && addedPageIndex !== undefined ? addedPageIndex : currentPages.length -1); // Fallback if not found
      setSelectedElement(null);
      setEditorSaveStatus('saved');
    }
  };

  const confirmDeletePage = async () => {
    if (pageToDeleteIndex === null || !websiteId) return;
    if (currentPages.length <= 1) {
      toast({ title: "Cannot Delete Page", description: "You must have at least one page.", variant: "destructive" });
      setPageToDeleteIndex(null);
      return;
    }
    const pageToDelete = currentPages[pageToDeleteIndex];
    if (!pageToDelete || !pageToDelete._id) {
      toast({title: "Error", description: "Page ID not found for deletion.", variant: "destructive"});
      setPageToDeleteIndex(null);
      return;
    }

    setEditorSaveStatus('saving');
    const result = await deletePageFromWebsite(websiteId, pageToDelete._id.toString());
    
    if (result.error) {
      toast({ title: "Error Deleting Page", description: result.error, variant: "destructive" });
      setEditorSaveStatus('error');
    } else {
      toast({ title: "Page Deleted", description: `Page "${pageToDelete.name}" has been removed.` });
      await loadWebsiteData(websiteId); // Reload to get the new version
      setActivePageIndex(Math.max(0, pageToDeleteIndex -1));
      setSelectedElement(null);
      setEditorSaveStatus('saved');
    }
    setPageToDeleteIndex(null);
  };


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggedItemType(null); // Reset after drag

    if (!over) return;

    setCurrentPages(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages)) as IWebsiteVersionPage[];
        const activePage = newPages[activePageIndex];
        if (!activePage) return prevPages;

        // Case 1: Dragging a new component from the sidebar
        if (active.data.current?.isSidebarItem) {
            const componentType = active.data.current.type as string;
            const componentConf = getComponentConfig(componentType);
            if (!componentConf) return prevPages;

            const newElement: IPageComponent = {
                _id: new mongoose.Types.ObjectId().toString(),
                type: componentType,
                label: componentConf.label,
                config: componentConf.defaultConfig || {},
                order: 0 // Placeholder, will be set correctly below
            };

            let targetIndex = activePage.elements.length; // Default to end
            if (over.id !== 'canvas-drop-area') { // Dropped onto an existing element
                const overElementIndex = activePage.elements.findIndex(el => el._id === over.id);
                if (overElementIndex !== -1) {
                    targetIndex = overElementIndex + 1; // Insert after the element it was dropped on
                }
            }
            
            activePage.elements.splice(targetIndex, 0, newElement);
            toast({ title: "Component Added", description: `${componentConf.label} added to page.`});

        } 
        // Case 2: Reordering existing components within the canvas
        else if (active.id !== over.id) {
            const oldIndex = activePage.elements.findIndex(el => el._id === active.id);
            const newIndex = activePage.elements.findIndex(el => el._id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                activePage.elements = arrayMove(activePage.elements, oldIndex, newIndex);
            }
        } else {
            return prevPages; // No change if dropped on itself or invalid drop
        }

        // Update order property for all elements in the active page
        activePage.elements.forEach((el, index) => {
            el.order = index;
        });
        
        setEditorSaveStatus('unsaved_changes');
        return newPages;
    });
  };
  
  const renderPropertyFields = () => {
    const activePageData = currentPages[activePageIndex];

    if (selectedElement && activePageData && activePageData.elements[selectedElement.elementIndex]) {
      const currentElement = activePageData.elements[selectedElement.elementIndex];
      const componentMeta = getComponentConfig(currentElement.type);

      return (
        <>
          <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{componentMeta?.label || currentElement.type}</strong></p>
          {Object.entries(componentMeta?.defaultConfig || {}).map(([key, defaultValue]) => {
            const currentValue = currentElement.config?.[key] !== undefined ? currentElement.config[key] : defaultValue;
            
            if (key === 'text' || key === 'htmlContent' || key === 'subtitle' || key === 'description' || key === 'copyrightText' || key === 'content') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Textarea id={`prop-${key}`} value={currentValue || ""} placeholder={`Enter ${key}`} className="text-xs bg-input" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                </div>
              );
            } else if (key === 'links' && selectedElement.type === 'navbar') { // Specific handling for Navbar links
                return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">Links (JSON)</Label>
                    <Textarea 
                      id={`prop-${key}`} 
                      value={JSON.stringify(currentValue || [], null, 2)} 
                      placeholder="Enter array of link objects" 
                      className="text-xs bg-input h-32 font-mono" 
                      onChange={(e) => {
                        try {
                          const parsedLinks = JSON.parse(e.target.value);
                          if (Array.isArray(parsedLinks)) {
                            handlePropertyChange('links', parsedLinks);
                          }
                        } catch (err) { /* Ignore parse errors during typing */ }
                      }} 
                    />
                    <FormDescription className="text-xs">
                      E.g., `[{"text": "Home", "href": "/", "type": "internal"}]`
                    </FormDescription>
                  </div>
                );
            } else if (key === 'src' || key === 'link' || key === 'buttonLink' || key === 'backgroundImage' || key === 'liveDemoUrl' || key === 'previewImageUrl' || key === 'avatar' || key === 'image' || key === 'imageUrl') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input type="url" id={`prop-${key}`} value={currentValue || ""} placeholder="https://example.com" className="text-xs bg-input" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                   {(key === 'src' || key === 'image' || key === 'imageUrl' || key === 'avatar' || key === 'backgroundImage') && currentValue && typeof currentValue === 'string' && (
                    <div className="mt-1"><img src={currentValue} alt={'Preview'} className="rounded-md max-w-full h-auto border bg-muted" data-ai-hint={currentElement.config?.dataAiHint as string || 'placeholder image'}/></div>
                   )}
                </div>
              );
            } else if (key === 'color' || key === 'backgroundColor' || key === 'textColor') {
                return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input type="color" id={`prop-${key}`} value={currentValue as string || "#000000"} className="text-xs h-8 w-full bg-input" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                  </div>
                );
            } else if (key === 'level' && currentElement.type === 'heading') {
               return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor="headingLevel" className="text-xs">Level (H1-H6)</Label>
                  <Select value={currentValue as string || "h2"} onValueChange={(value) => handlePropertyChange(key, value)}>
                    <SelectTrigger id="headingLevel" className="w-full text-xs bg-input"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent><SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem></SelectContent>
                  </Select>
                </div>
              );
            } else if (key === 'style' && currentElement.type === 'button') {
               return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor="buttonStyle" className="text-xs">Style</Label>
                   <Select value={currentValue as string || "primary"} onValueChange={(value) => handlePropertyChange(key, value)}>
                    <SelectTrigger id="buttonStyle" className="w-full text-xs bg-input"><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="outline">Outline</SelectItem></SelectContent>
                  </Select>
                </div>
              );
            } else if (typeof defaultValue === 'boolean') {
              return (
                <div key={key} className="space-y-1 mt-2 flex items-center justify-between p-2 border rounded bg-input/50">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize mr-2">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input type="checkbox" id={`prop-${key}`} checked={!!currentValue} className="text-xs scale-90 accent-primary" onChange={(e) => handlePropertyChange(key, e.target.checked)} />
                </div>
              );
            } else if (Array.isArray(defaultValue) || (typeof defaultValue === 'object' && defaultValue !== null)) {
              return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')} (JSON)</Label>
                    <Textarea id={`prop-${key}`} value={JSON.stringify(currentValue, null, 2) || ""} placeholder={`Enter JSON for ${key}`} className="text-xs h-24 bg-input font-mono" onChange={(e) => { try { handlePropertyChange(key, JSON.parse(e.target.value)); } catch (err) { /* Ignore parse error on live typing */ } }} />
                  </div>
              );
            }
            return (
              <div key={key} className="space-y-1 mt-2">
                <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                <Input type={typeof defaultValue === 'number' ? 'number' : 'text'} id={`prop-${key}`} value={(currentValue || "").toString()} placeholder={`Enter ${key}`} className="text-xs bg-input" onChange={(e) => handlePropertyChange(key, typeof defaultValue === 'number' ? parseFloat(e.target.value) : e.target.value)} />
              </div>
            );
          })}
        </>
      );
    } else if (activePageData) { 
      return (
        <>
          <p className="text-sm text-muted-foreground mb-3">Page Settings: <strong>{activePageData.name}</strong></p>
          <div className="space-y-2">
            <Label htmlFor="pageName" className="text-xs">Page Name</Label>
            <Input type="text" id="pageName" value={activePageData.name || ""} placeholder="Home" className="text-xs bg-input" onChange={(e) => handlePropertyChange('name', e.target.value, true)} 
                   onBlur={(e) => handlePageDetailsChange(activePageData._id as string, e.target.value, activePageData.slug)}
            />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="pageSlug" className="text-xs">Slug (URL Path)</Label>
            <Input type="text" id="pageSlug" value={activePageData.slug || ""} placeholder="/home" className="text-xs bg-input" onChange={(e) => handlePropertyChange('slug', e.target.value, true)} 
                   onBlur={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, e.target.value)}
            />
             <FormDescription className="text-xs">Must start with / and be unique within the site.</FormDescription>
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="seoTitle" className="text-xs">SEO Title</Label>
            <Input type="text" id="seoTitle" value={activePageData.seoTitle || ""} placeholder="Page Title for SEO" className="text-xs bg-input" onChange={(e) => handlePropertyChange('seoTitle', e.target.value, true)} 
                   onBlur={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug)} // Assuming SEO changes also trigger versioning
            />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="seoDescription" className="text-xs">SEO Description</Label>
            <Textarea id="seoDescription" value={activePageData.seoDescription || ""} placeholder="Page description for SEO" className="text-xs bg-input" rows={3} onChange={(e) => handlePropertyChange('seoDescription', e.target.value, true)} 
                      onBlur={() => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug)}
            />
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
    <DndContext 
        sensors={sensors} 
        onDragStart={(event) => setActiveDraggedItemType(event.active.data.current?.type as string || null)}
        onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} websiteId={websiteId} editorSaveStatus={editorSaveStatus} onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)} onOpenTemplateGalleryModal={() => setIsTemplateGalleryModalOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <ComponentLibrarySidebar />
          <main className="flex-1 flex flex-col p-1 md:p-2 lg:p-4 overflow-hidden bg-muted/30">
            <div className="flex justify-between items-center p-2 border-b bg-card mb-2 gap-3">
              <Tabs value={activePageIndex.toString()} onValueChange={(value) => {setActivePageIndex(parseInt(value)); setSelectedElement(null);}} className="max-w-[calc(100%-200px)] overflow-x-auto">
                <TabsList className="bg-transparent p-0 h-auto">
                  {currentPages.map((page, index) => (
                    <TabsTrigger key={page._id as string || index} value={index.toString()} className="text-xs px-2 py-1.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary">
                      {page.name}
                      {currentPages.length > 1 && (
                           <AlertDialogTrigger
                              asChild
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPageToDeleteIndex(index); }} 
                           >
                              <button
                                  className="ml-1.5 p-0.5 rounded hover:bg-destructive/20 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                  aria-label={`Delete page ${page.name}`}
                                  title={`Delete page ${page.name}`}
                              >
                                  <Trash2 className="h-3 w-3 text-destructive/70 hover:text-destructive"/>
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
            <CanvasEditor devicePreview={currentDevice} page={currentEditorPage} pageIndex={activePageIndex} onElementSelect={handleElementSelect} />
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
                <AlertDialogFooter><AlertDialogCancel onClick={() => setPageToDeleteIndex(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeletePage} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
}

export default function EditorPage() {
  return (<Suspense fallback={<div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading editor...</p></div>}><EditorPageComponent /></Suspense>);
}

declare module '@/models/WebsiteVersion' {
  interface IPageComponent {
    _id?: string | import('mongoose').Types.ObjectId;
  }
  interface IWebsiteVersionPage {
    _id?: string | import('mongoose').Types.ObjectId;
  }
}
