
"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType, type EditorSaveStatus } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2, PlusCircle, Navigation as NavigationIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDescription } from '@/components/ui/form';
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import type { IWebsite, IWebsiteVersionPage } from '@/models/WebsiteVersion'; // Changed from IWebsite to IWebsiteVersion for IWebsiteVersionPage
import type { IPageComponent } from '@/models/PageComponent';
import type { ITemplate } from '@/models/Template';
import type { INavigation } from '@/models/Navigation';
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

  const [allSiteNavigations, setAllSiteNavigations] = useState<INavigation[]>([]);
  const [isNavigationsLoading, setIsNavigationsLoading] = useState(false);
  const [newNavigationName, setNewNavigationName] = useState("");
  const [navigationToDeleteId, setNavigationToDeleteId] = useState<string | null>(null);


  const fetchSiteNavigations = useCallback(async (currentWebsiteId: string | null) => {
    if (!currentWebsiteId) {
      setAllSiteNavigations([]);
      return;
    }
    setIsNavigationsLoading(true);
    try {
      const response = await fetch(`/api/navigation?websiteId=${currentWebsiteId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setAllSiteNavigations(result.data);
      } else {
        setAllSiteNavigations([]);
        toast({ title: "Error", description: result.error || "Failed to load site navigations.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch site navigations.", variant: "destructive" });
      setAllSiteNavigations([]);
    } finally {
      setIsNavigationsLoading(false);
    }
  }, [toast]);

  const loadWebsiteData = useCallback(async (id: string) => {
    setIsLoadingWebsite(true);
    setEditorSaveStatus('idle');
    setSelectedElement(null); 
    try {
      const result = await getWebsiteEditorData(id);
      if (result.error) {
        toast({ title: "Error Loading Website", description: result.error, variant: "destructive" });
        setWebsiteData(null);
        setCurrentPages([JSON.parse(JSON.stringify(defaultInitialPage))]);
        setActivePageIndex(0);
      } else if (result.website) {
        setWebsiteData(result.website);
        await fetchSiteNavigations(id); // Fetch navigations associated with this website
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
  }, [toast, fetchSiteNavigations]);

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
      setAllSiteNavigations([]);
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
      const newPages = JSON.parse(JSON.stringify(prevPages)) as IWebsiteVersionPage[];
      const pageToUpdate = newPages[activePageIndex];

      if (pageToUpdate) {
        if (isPageSetting) {
          (pageToUpdate as any)[propertyName] = value;
        } else if (selectedElement && pageToUpdate.elements[selectedElement.elementIndex]) {
          const elementToUpdate = pageToUpdate.elements[selectedElement.elementIndex];
          if (elementToUpdate) {
            if (propertyName === 'config' && typeof value === 'object' && value !== null) { 
              elementToUpdate.config = { ...elementToUpdate.config, ...value };
            } else { 
              elementToUpdate.config = { ...elementToUpdate.config, [propertyName]: value };
            }
             // If linking a Navbar to a Navigation entity, update its links from the source
            if (elementToUpdate.type === 'navbar' && propertyName === 'navigationId') {
              const selectedNav = allSiteNavigations.find(nav => nav._id === value);
              if (selectedNav) {
                elementToUpdate.config.links = selectedNav.items.map(item => ({ text: item.label, href: item.url, type: item.target === '_blank' ? 'external' : 'internal' }));
              } else if (!value) { // "None" selected
                elementToUpdate.config.links = getComponentConfig('navbar')?.defaultConfig?.links || [];
              }
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

  const handlePageDetailsChange = async (pageId: string, newName: string, newSlug: string, seoTitle?: string, seoDescription?: string) => {
    if (!websiteId) return;
    const pageToUpdate = currentPages.find(p => p._id === pageId);
    if (!pageToUpdate) return;

    const currentName = pageToUpdate.name;
    const currentSlug = pageToUpdate.slug;
    const currentSeoTitle = pageToUpdate.seoTitle;
    const currentSeoDescription = pageToUpdate.seoDescription;

    const sanitizedSlug = newSlug.startsWith('/') ? newSlug : `/${newSlug}`;
    
    // Only proceed if there's an actual change
    if (currentName === newName && currentSlug === sanitizedSlug && currentSeoTitle === seoTitle && currentSeoDescription === seoDescription) {
      return; // No changes to persist
    }

    setEditorSaveStatus('saving');
    try {
      const response = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, slug: sanitizedSlug, seoTitle, seoDescription }),
      });
      const result = await response.json();

      if (result.success && result.data) {
        toast({ title: "Page Updated!", description: `Page "${result.data.name}" details saved.` });
        await loadWebsiteData(websiteId); // Reload to get new version and ensure UI consistency
        const updatedPageIndex = currentPages.findIndex(p => p._id === result.data?._id);
        setActivePageIndex(updatedPageIndex !== -1 ? updatedPageIndex : 0);
        setEditorSaveStatus('saved');
      } else {
        toast({ title: "Error updating page", description: result.error || "Could not save page details.", variant: "destructive" });
        setEditorSaveStatus('error');
        // Revert local state if server update failed (optional, or provide a retry mechanism)
        setCurrentPages(prev => prev.map(p => p._id === pageId ? {...p, name: currentName, slug: currentSlug, seoTitle: currentSeoTitle, seoDescription: currentSeoDescription} : p));
      }
    } catch (error: any) {
      toast({ title: "Page Update Error", description: error.message, variant: "destructive" });
      setEditorSaveStatus('error');
      setCurrentPages(prev => prev.map(p => p._id === pageId ? {...p, name: currentName, slug: currentSlug, seoTitle: currentSeoTitle, seoDescription: currentSeoDescription} : p));
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
            order: index, 
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
    setEditorSaveStatus('saving');
    const newPageBaseName = "New Page";
    let newPageName = newPageBaseName;
    let counter = 1;
    const existingPageNames = currentPages.map(p => p.name);
    while (existingPageNames.includes(newPageName)) {
      newPageName = `${newPageBaseName} ${counter++}`;
    }
    const newPageSlug = `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`;
    
    try {
      const response = await fetch(`/api/websites/${websiteId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPageName, slug: newPageSlug, elements: [] }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        toast({ title: "Page Added", description: `Page "${result.data.name}" created.` });
        await loadWebsiteData(websiteId);
        const addedPageIndex = result.data?.parentVersion?.pages.findIndex((p: IWebsiteVersionPage) => p._id === result.data._id);
        setActivePageIndex(addedPageIndex !== -1 && addedPageIndex !== undefined ? addedPageIndex : currentPages.length -1);
        setSelectedElement(null);
        setEditorSaveStatus('saved');
      } else {
        toast({ title: "Error Adding Page", description: result.error || "Could not add page.", variant: "destructive" });
        setEditorSaveStatus('error');
      }
    } catch (error:any) {
        toast({ title: "Error Adding Page", description: error.message, variant: "destructive" });
        setEditorSaveStatus('error');
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
    try {
        const response = await fetch(`/api/websites/${websiteId}/pages/${pageToDelete._id.toString()}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
            toast({ title: "Page Deleted", description: `Page "${pageToDelete.name}" has been removed.` });
            await loadWebsiteData(websiteId);
            setActivePageIndex(Math.max(0, pageToDeleteIndex -1));
            setSelectedElement(null);
            setEditorSaveStatus('saved');
        } else {
            toast({ title: "Error Deleting Page", description: result.error || "Could not delete page.", variant: "destructive" });
            setEditorSaveStatus('error');
        }
    } catch (error: any) {
        toast({ title: "Error Deleting Page", description: error.message, variant: "destructive" });
        setEditorSaveStatus('error');
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
    setActiveDraggedItemType(null);

    if (!over) return;

    setCurrentPages(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages)) as IWebsiteVersionPage[];
        const activePage = newPages[activePageIndex];
        if (!activePage) return prevPages;

        if (active.data.current?.isSidebarItem) {
            const componentType = active.data.current.type as string;
            const componentConf = getComponentConfig(componentType);
            if (!componentConf) return prevPages;

            const newElement: IPageComponent = {
                _id: new mongoose.Types.ObjectId().toString(),
                type: componentType,
                label: componentConf.label,
                config: JSON.parse(JSON.stringify(componentConf.defaultConfig || {})),
                order: 0 
            };

            let targetIndex = activePage.elements.length;
            if (over.id !== 'canvas-drop-area') {
                const overElementIndex = activePage.elements.findIndex(el => el._id === over.id);
                if (overElementIndex !== -1) {
                    targetIndex = overElementIndex + 1; 
                }
            }
            
            activePage.elements.splice(targetIndex, 0, newElement);
            toast({ title: "Component Added", description: `${componentConf.label} added to page.`});

        } 
        else if (active.id !== over.id) {
            const oldIndex = activePage.elements.findIndex(el => el._id === active.id);
            const newIndex = activePage.elements.findIndex(el => el._id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                activePage.elements = arrayMove(activePage.elements, oldIndex, newIndex);
            }
        } else {
            return prevPages;
        }

        activePage.elements.forEach((el, index) => { el.order = index; });
        
        setEditorSaveStatus('unsaved_changes');
        return newPages;
    });
  };

  const handleCreateNavigation = async () => {
    if (!newNavigationName.trim() || !websiteId) {
      toast({ title: "Error", description: "Navigation name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsNavigationsLoading(true);
    try {
      const response = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newNavigationName, websiteId, items: [] }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Navigation Created", description: `Navigation "${result.data.name}" added.` });
        setNewNavigationName("");
        await fetchSiteNavigations(websiteId);
      } else {
        toast({ title: "Error", description: result.error || "Failed to create navigation.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not create navigation.", variant: "destructive" });
    } finally {
      setIsNavigationsLoading(false);
    }
  };

  const handleDeleteNavigation = async () => {
    if (!navigationToDeleteId || !websiteId) return;
    setIsNavigationsLoading(true);
    try {
      const response = await fetch(`/api/navigation/${navigationToDeleteId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Navigation Deleted", description: result.message });
        // Reset navigationId for any Navbar component that was using this deleted navigation
        setCurrentPages(prevPages => {
          const newPages = JSON.parse(JSON.stringify(prevPages)) as IWebsiteVersionPage[];
          newPages.forEach(page => {
            page.elements.forEach(el => {
              if (el.type === 'navbar' && el.config.navigationId === navigationToDeleteId) {
                el.config.navigationId = null;
                el.config.links = getComponentConfig('navbar')?.defaultConfig?.links || [];
              }
            });
          });
          return newPages;
        });
        setEditorSaveStatus('unsaved_changes'); // Mark changes to be saved
        await fetchSiteNavigations(websiteId);
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete navigation.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not delete navigation.", variant: "destructive" });
    } finally {
      setIsNavigationsLoading(false);
      setNavigationToDeleteId(null);
    }
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
            
            if (key === 'navigationId' && currentElement.type === 'navbar') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor="navbarNavigation" className="text-xs">Link to Site Navigation</Label>
                  <Select
                    value={(currentValue as string) || ""}
                    onValueChange={(value) => handlePropertyChange(key, value || null)}
                  >
                    <SelectTrigger id="navbarNavigation" className="w-full text-xs bg-input">
                      <SelectValue placeholder="Select a navigation or edit links manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Manual Links)</SelectItem>
                      {isNavigationsLoading ? (
                        <div className="p-2 text-xs text-muted-foreground">Loading navigations...</div>
                      ) : allSiteNavigations.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground">No site navigations created yet.</div>
                      ) : (
                        allSiteNavigations.map(nav => (
                          <SelectItem key={nav._id as string} value={nav._id as string}>{nav.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (key === 'links' && currentElement.type === 'navbar') { 
                return (
                  <div key={key} className="space-y-1 mt-2">
                    <Label htmlFor={`prop-${key}`} className="text-xs capitalize">Links (JSON) {currentElement.config.navigationId ? <span className="text-muted-foreground text-xxs">(From selected navigation)</span> : ''}</Label>
                    <Textarea 
                      id={`prop-${key}`} 
                      value={JSON.stringify(currentValue || [], null, 2)} 
                      placeholder="Enter array of link objects" 
                      className="text-xs bg-input h-32 font-mono" 
                      disabled={!!currentElement.config.navigationId} // Disable if linked to a global navigation
                      onChange={(e) => {
                        try {
                          const parsedLinks = JSON.parse(e.target.value);
                          if (Array.isArray(parsedLinks)) {
                            handlePropertyChange(key, parsedLinks);
                          }
                        } catch (err) { /* Ignore parse errors during typing */ }
                      }} 
                    />
                    <FormDescription className="text-xs">
                      E.g., `[{"text": "Home", "href": "/", "type": "internal"}]`. Readonly if linked to Site Navigation.
                    </FormDescription>
                  </div>
                );
            }
            
            if (key === 'text' || key === 'htmlContent' || key === 'subtitle' || key === 'description' || key === 'copyrightText' || key === 'content' || key === 'brandText') {
              return (
                <div key={key} className="space-y-1 mt-2">
                  <Label htmlFor={`prop-${key}`} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Textarea id={`prop-${key}`} value={currentValue || ""} placeholder={`Enter ${key}`} className="text-xs bg-input" onChange={(e) => handlePropertyChange(key, e.target.value)} />
                </div>
              );
            } else if (key === 'src' || key === 'link' || key === 'buttonLink' || key === 'backgroundImage' || key === 'liveDemoUrl' || key === 'previewImageUrl' || key === 'avatar' || key === 'image' || key === 'imageUrl' || key === 'brandLink') {
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
               // Skip rendering JSON textareas for complex objects if a custom UI (like navigationId dropdown) is handling it
              if (key === 'links' && currentElement.type === 'navbar' && componentMeta?.defaultConfig?.navigationId !== undefined) {
                return null; 
              }
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
    } else if (activePageData) { // Page settings
      return (
      <Tabs defaultValue="page-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-auto">
          <TabsTrigger value="page-settings" className="text-xs px-2 py-1.5 h-auto">Page Settings</TabsTrigger>
          <TabsTrigger value="site-navigations" className="text-xs px-2 py-1.5 h-auto">Site Navigations</TabsTrigger>
        </TabsList>
        <TabsContent value="page-settings">
          <Card><CardHeader><CardTitle className="text-base font-semibold">Page: {activePageData.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="pageName" className="text-xs">Page Name</Label>
              <Input type="text" id="pageName" defaultValue={activePageData.name || ""} placeholder="Home" className="text-xs bg-input" 
                    onBlur={(e) => handlePageDetailsChange(activePageData._id as string, e.target.value, activePageData.slug, activePageData.seoTitle, activePageData.seoDescription)}
              />
            </div>
            <div>
              <Label htmlFor="pageSlug" className="text-xs">Slug (URL Path)</Label>
              <Input type="text" id="pageSlug" defaultValue={activePageData.slug || ""} placeholder="/home" className="text-xs bg-input" 
                    onBlur={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, e.target.value, activePageData.seoTitle, activePageData.seoDescription)}
              />
              <FormDescription className="text-xs">Must start with / and be unique within the site.</FormDescription>
            </div>
            <div>
              <Label htmlFor="seoTitle" className="text-xs">SEO Title</Label>
              <Input type="text" id="seoTitle" defaultValue={activePageData.seoTitle || ""} placeholder="Page Title for SEO" className="text-xs bg-input" 
                     onBlur={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, e.target.value, activePageData.seoDescription)}
              />
            </div>
            <div>
              <Label htmlFor="seoDescription" className="text-xs">SEO Description</Label>
              <Textarea id="seoDescription" defaultValue={activePageData.seoDescription || ""} placeholder="Page description for SEO" className="text-xs bg-input" rows={3} 
                        onBlur={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, activePageData.seoTitle, e.target.value)}
              />
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="site-navigations">
           <Card><CardHeader><CardTitle className="text-base font-semibold flex items-center"><NavigationIcon className="mr-2 h-4 w-4"/>Manage Site Navigations</CardTitle></CardHeader>
           <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newNavigationName" className="text-xs">Create New Navigation</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  id="newNavigationName" 
                  value={newNavigationName} 
                  onChange={(e) => setNewNavigationName(e.target.value)} 
                  placeholder="e.g., Main Menu" 
                  className="text-xs bg-input"
                  disabled={!websiteId || isNavigationsLoading}
                />
                <Button size="sm" onClick={handleCreateNavigation} disabled={!websiteId || isNavigationsLoading || !newNavigationName.trim()}>
                  {isNavigationsLoading && newNavigationName ? <Loader2 className="animate-spin h-4 w-4" /> : <PlusCircle className="h-4 w-4"/>}
                </Button>
              </div>
            </div>
            {isNavigationsLoading && !allSiteNavigations.length ? (
              <div className="text-xs text-muted-foreground py-2">Loading navigations...</div>
            ) : allSiteNavigations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No site navigations created yet for this website.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {allSiteNavigations.map(nav => (
                  <div key={nav._id as string} className="flex items-center justify-between p-2 border rounded-md bg-input/30">
                    <span className="text-xs font-medium truncate" title={nav.name}>{nav.name}</span>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNavigationToDeleteId(nav._id as string)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive"/>
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                ))}
              </div>
            )}
           </CardContent></Card>
        </TabsContent>
      </Tabs>
      );
    }
    return <p className="text-sm text-muted-foreground p-4">Select an element or manage page settings.</p>;
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
            <Card className="flex-1"><CardHeader><CardTitle className="font-headline text-lg flex items-center">{selectedElement ? <><MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />{(getComponentConfig(selectedElement.type)?.label || selectedElement.type)} Properties</> : <><Settings className="w-5 h-5 mr-2 text-primary" />Page & Site Settings</>}</CardTitle></CardHeader>
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
        <AlertDialog open={navigationToDeleteId !== null} onOpenChange={(open) => !open && setNavigationToDeleteId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Navigation?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the navigation: "{allSiteNavigations.find(n => n._id === navigationToDeleteId)?.name || ''}"? This cannot be undone and may affect Navbars using it.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel onClick={() => setNavigationToDeleteId(null)} disabled={isNavigationsLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteNavigation} className="bg-destructive hover:bg-destructive/90" disabled={isNavigationsLoading}>{isNavigationsLoading ? <Loader2 className="animate-spin h-4 w-4"/> : "Delete"}</AlertDialogAction></AlertDialogFooter>
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

```