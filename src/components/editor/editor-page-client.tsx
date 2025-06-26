
"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType, type EditorSaveStatus } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2, PlusCircle, Navigation as NavigationIcon, Link as LinkIcon, Copy, X, Edit, UploadCloud, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import { getCloudinarySignature } from '@/actions/assets';
import type { IWebsite } from '@/models/Website';
import type { IWebsiteVersion, IWebsiteVersionPage } from '@/models/WebsiteVersion';
import type { IPageComponent } from '@/models/PageComponent';
import type { ITemplate } from '@/models/Template';
import type { INavigation, INavigationItem } from '@/models/Navigation';
import { useToast } from '@/hooks/use-toast';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getComponentConfig } from '@/components/editor/componentRegistry';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
  type Active,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { createNavigation, getNavigationsByWebsiteId, updateNavigation, deleteNavigation } from '@/actions/navigation';
import { AiChatAssistant } from './ai-chat-assistant';
import { editWebsite, type EditWebsiteInput } from '@/ai/flows/edit-website-flow';


interface SelectedElementData extends IPageComponent {
  pageIndex: number;
  elementIndex: number;
}

const newObjectId = () => Math.random().toString(36).substring(2, 15);

const defaultInitialPage: IWebsiteVersionPage = {
  _id: newObjectId(),
  name: "Home",
  slug: "/",
  elements: [],
  seoTitle: "Home Page",
  seoDescription: "Welcome to your new site!",
};

export default function EditorPageComponent() {
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
  const [showPageDeleteConfirm, setShowPageDeleteConfirm] = useState(false);

  const [activeDraggedItem, setActiveDraggedItem] = useState<Active | null>(null);


  const [allSiteNavigations, setAllSiteNavigations] = useState<INavigation[]>([]);
  const [isNavigationsLoading, setIsNavigationsLoading] = useState(false);
  const [newNavigationName, setNewNavigationName] = useState("");
  const [navigationToDeleteId, setNavigationToDeleteId] = useState<string | null>(null);
  const [showNavDeleteConfirm, setShowNavDeleteConfirm] = useState(false);

  const [selectedNavigationForEditing, setSelectedNavigationForEditing] = useState<INavigation | null>(null);
  const [editingNavItems, setEditingNavItems] = useState<INavigationItem[]>([]);
  const [editingNavName, setEditingNavName] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetKey, setUploadTargetKey] = useState<string | null>(null);
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorSaveStatus === 'unsaved_changes') {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome and some other browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [editorSaveStatus]);

  const fetchSiteNavigations = useCallback(async (currentWebsiteId: string | null) => {
    if (!currentWebsiteId) {
      setAllSiteNavigations([]);
      return;
    }
    setIsNavigationsLoading(true);
    try {
      const result = await getNavigationsByWebsiteId(currentWebsiteId);
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
        await fetchSiteNavigations(null);
      } else if (result.website) {
        setWebsiteData(result.website);
        await fetchSiteNavigations(id);
        if (result.currentVersion && result.currentVersion.pages.length > 0) {
          const sanitizedPages = result.currentVersion.pages.map(p => ({
            ...p,
            _id: (p._id || newObjectId()).toString(),
            elements: p.elements.map(el => ({
              ...el,
              _id: (el._id || newObjectId()).toString(),
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
      await fetchSiteNavigations(null);
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
      fetchSiteNavigations(null);
    }
  }, [websiteIdFromQuery, websiteId, loadWebsiteData, fetchSiteNavigations]);

  const findElementRecursive = (elements: IPageComponent[], elementId: string): { element: IPageComponent, parentList: IPageComponent[] } | null => {
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el._id === elementId) {
            return { element: el, parentList: elements };
        }
        if (el.config?.elements && Array.isArray(el.config.elements)) {
            const found = findElementRecursive(el.config.elements, elementId);
            if (found) return found;
        }
        if (el.config?.columns && Array.isArray(el.config.columns)) {
            for (const col of el.config.columns) {
                if (col.elements && Array.isArray(col.elements)) {
                    const found = findElementRecursive(col.elements, elementId);
                    if (found) return found;
                }
            }
        }
    }
    return null;
  };
  
  const handleElementSelect = useCallback((elementId: string, pageIndex: number) => {
    const page = currentPages[pageIndex];
    if (page) {
      const result = findElementRecursive(page.elements, elementId);
      if (result) {
        const elementIndex = result.parentList.findIndex(e => e._id === elementId);
        setSelectedElement({ ...result.element, pageIndex, elementIndex });
      }
    }
  }, [currentPages]);

  const handlePropertyChange = (path: string, value: any) => {
      setCurrentPages(prevPages => {
          const newPages = JSON.parse(JSON.stringify(prevPages));
          if (!selectedElement) return newPages;
  
          const pageToUpdate = newPages[activePageIndex];
          if (!pageToUpdate) return newPages;
  
          let finalUpdatedElement: IPageComponent | null = null;
  
          const setDeepValue = (obj: any, pathString: string, valueToSet: any) => {
              const pathArray = pathString.match(/([^[.\]])+/g) || [];
              let current = obj;
              for (let i = 0; i < pathArray.length - 1; i++) {
                  const key = pathArray[i];
                  if (current[key] === undefined) {
                      const nextKeyIsNumber = !isNaN(parseInt(pathArray[i + 1], 10));
                      current[key] = nextKeyIsNumber ? [] : {};
                  }
                  current = current[key];
              }
              current[pathArray[pathArray.length - 1]] = valueToSet;
          };
  
          const updateElementInList = (elements: IPageComponent[]): boolean => {
              for (let el of elements) {
                  if (el._id === selectedElement._id) {
                      setDeepValue(el.config, path, value);
                      finalUpdatedElement = el;
                      return true;
                  }
                  if (el.config?.elements && Array.isArray(el.config.elements)) {
                      if (updateElementInList(el.config.elements)) return true;
                  }
                  if (el.config?.columns && Array.isArray(el.config.columns)) {
                      for (const col of el.config.columns) {
                          if (col.elements && Array.isArray(col.elements)) {
                              if (updateElementInList(col.elements)) return true;
                          }
                      }
                  }
              }
              return false;
          };
  
          updateElementInList(pageToUpdate.elements);
  
          if (finalUpdatedElement) {
              if (finalUpdatedElement.type === 'navbar' && path === 'navigationId') {
                  const selectedNav = allSiteNavigations.find(nav => nav._id === value);
                  if (selectedNav) {
                      finalUpdatedElement.config.links = selectedNav.items.map(item => ({ text: item.label, href: item.url, type: item.type || 'internal' }));
                  } else if (!value) {
                      finalUpdatedElement.config.links = getComponentConfig('navbar')?.defaultConfig?.links || [];
                  }
              }
              setSelectedElement(prevSel => prevSel ? { ...prevSel, config: JSON.parse(JSON.stringify(finalUpdatedElement!.config)) } : null);
          }
  
          setEditorSaveStatus('unsaved_changes');
          return newPages;
      });
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!uploadTargetKey) return;

    setIsUploading(true);
    toast({ title: 'Uploading image...', description: 'Please wait.' });

    try {
        const signatureResult = await getCloudinarySignature({ folder: 'ncbx_user_assets' });
        if (signatureResult.error || !signatureResult.signature) {
            throw new Error(signatureResult.error || 'Failed to get upload signature.');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureResult.apiKey!);
        formData.append('timestamp', signatureResult.timestamp!.toString());
        formData.append('signature', signatureResult.signature);
        formData.append('folder', 'ncbx_user_assets');

        const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${signatureResult.cloudName!}/image/upload`;
        const response = await fetch(cloudinaryUploadUrl, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.secure_url) {
            handlePropertyChange(uploadTargetKey, data.secure_url);
            toast({ title: 'Upload Successful!', description: 'Image has been updated.' });
        } else {
            throw new Error(data.error?.message || 'Cloudinary upload failed.');
        }

    } catch (error: any) {
        toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsUploading(false);
        setUploadTargetKey(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };


  const handlePageDetailsChange = async (pageId: string, newName: string, newSlug: string, seoTitle?: string, seoDescription?: string) => {
    setCurrentPages(prev => prev.map(p => p._id === pageId ? {...p, name: newName, slug: newSlug, seoTitle, seoDescription } : p));
    setEditorSaveStatus('unsaved_changes');
  };

  const getEditorContentForSave = useCallback((): SaveWebsiteContentInput['pages'] => {
    const reorderAndClean = (elements: IPageComponent[]): any[] => {
        return elements.map((el, index) => ({
            _id: el._id as string,
            type: el.type,
            config: el.type === 'section' ? { ...el.config, elements: reorderAndClean(el.config.elements || []) } : 
                    el.type === 'columns' ? { ...el.config, columns: el.config.columns.map((c: any) => ({ ...c, elements: reorderAndClean(c.elements || [])})) } :
                    el.config,
            order: index,
        }));
    };
    return currentPages.map(page => ({
      _id: page._id as string,
      name: page.name,
      slug: page.slug,
      elements: reorderAndClean(page.elements),
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
    }));
  }, [currentPages]);

  const handleApplyTemplate = useCallback((template: ITemplate) => {
    if (template.pages && template.pages.length > 0) {
      const newPagesWithIds = template.pages.map(p => ({
        ...p,
        _id: newObjectId(),
        elements: p.elements.map(el => ({ ...el, _id: newObjectId() }))
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
        // No need to reload, optimistic update is fine and prevents flicker
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

  const handleAddNewPage = async () => {
    const newPageBaseName = "New Page";
    let newPageName = newPageBaseName;
    let counter = 1;
    const existingPageNames = currentPages.map(p => p.name);
    while (existingPageNames.includes(newPageName)) {
      newPageName = `${newPageBaseName} ${counter++}`;
    }
    const newPageSlug = newPageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');


    const newPage: IWebsiteVersionPage = {
        _id: newObjectId(),
        name: newPageName,
        slug: `/${newPageSlug}`,
        elements: [],
    };
    
    setCurrentPages(prev => [...prev, newPage]);
    setActivePageIndex(currentPages.length);
    setSelectedElement(null);
    setEditorSaveStatus('unsaved_changes');
    toast({ title: "Page Added", description: `Page "${newPage.name}" created. Don't forget to save.` });
  };

  const confirmDeletePage = async () => {
    if (pageToDeleteIndex === null) return;
    if (currentPages.length <= 1) {
      toast({ title: "Cannot Delete Page", description: "You must have at least one page.", variant: "destructive" });
      setShowPageDeleteConfirm(false);
      setPageToDeleteIndex(null);
      return;
    }

    const pageToDelete = currentPages[pageToDeleteIndex];
    const deletedSlug = pageToDelete.slug;

    // Filter out the deleted page from the main state
    const newPages = currentPages.filter((_, index) => index !== pageToDeleteIndex);

    // Update any navigations that were linking to the deleted page
    const navUpdatePromises: Promise<any>[] = [];
    const updatedNavigationsLocally: INavigation[] = [];

    allSiteNavigations.forEach(nav => {
      const initialItemCount = nav.items.length;
      // Filter out internal links that match the slug of the deleted page
      const filteredItems = nav.items.filter(item => !(item.type === 'internal' && item.url === deletedSlug));

      if (filteredItems.length < initialItemCount) {
        // If items were removed, queue an update to the database
        navUpdatePromises.push(updateNavigation({
          navigationId: nav._id as string,
          items: filteredItems.map(({ label, url, type }) => ({ label, url, type })),
        }));
        updatedNavigationsLocally.push({ ...nav, items: filteredItems });
      } else {
        updatedNavigationsLocally.push(nav);
      }
    });
    
    // Wait for all navigation updates to complete in the database
    try {
      await Promise.all(navUpdatePromises);
      if (navUpdatePromises.length > 0) {
        toast({ title: "Navigations Updated", description: "Removed links to the deleted page." });
      }
    } catch(err) {
      console.error("Error updating navigations after page delete:", err);
      toast({ title: "Navigation Update Error", description: "Could not update all navigation menus.", variant: "destructive" });
    }

    // Refresh the local state for navigations to be used by the editor
    setAllSiteNavigations(updatedNavigationsLocally);

    // Now, refresh any navbar components currently in the editor state to reflect the updated navigation items
    const pagesWithRefreshedNavs = newPages.map(page => {
      const findAndRefreshNavbars = (elements: IPageComponent[]): IPageComponent[] => {
        return elements.map(el => {
          const newEl = { ...el }; // create a copy
          if (newEl.type === 'navbar' && newEl.config.navigationId) {
            const correspondingNav = updatedNavigationsLocally.find(n => n._id === newEl.config.navigationId);
            if (correspondingNav) {
              newEl.config.links = correspondingNav.items.map(item => ({ text: item.label, href: item.url, type: item.type || 'internal' }));
            }
          }
          // Recurse for nested elements
          if (newEl.config?.elements) newEl.config.elements = findAndRefreshNavbars(newEl.config.elements);
          if (newEl.config?.columns) newEl.config.columns.forEach((c: any) => { if (c.elements) c.elements = findAndRefreshNavbars(c.elements); });
          return newEl;
        });
      };
      return { ...page, elements: findAndRefreshNavbars(page.elements) };
    });
    
    // Final state updates
    setCurrentPages(pagesWithRefreshedNavs);
    setActivePageIndex(Math.max(0, pageToDeleteIndex - 1));
    setSelectedElement(null);
    setPageToDeleteIndex(null);
    setShowPageDeleteConfirm(false);
    setEditorSaveStatus('unsaved_changes');
    toast({ title: "Page Removed", description: `Page "${pageToDelete.name}" was removed. Save changes to persist.` });
  };
  
  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    setCurrentPages(prevPages => {
      const newPages = JSON.parse(JSON.stringify(prevPages));
      const page = newPages[activePageIndex];
      if (!page) return newPages;

      const deleteRecursive = (elements: IPageComponent[]): IPageComponent[] => {
        const result: IPageComponent[] = [];
        for (const el of elements) {
          if (el._id === selectedElement._id) {
            continue; // Skip this element to delete it
          }

          const newEl = { ...el }; // Create a copy to avoid direct mutation issues
          
          if (newEl.config?.elements && Array.isArray(newEl.config.elements)) {
            newEl.config = { ...newEl.config, elements: deleteRecursive(newEl.config.elements) };
          }
          
          if (newEl.config?.columns && Array.isArray(newEl.config.columns)) {
            newEl.config = {
              ...newEl.config,
              columns: newEl.config.columns.map((col: any) => ({
                ...col,
                elements: col.elements ? deleteRecursive(col.elements) : [],
              })),
            };
          }
          
          result.push(newEl);
        }
        return result;
      };
      
      page.elements = deleteRecursive(page.elements);
      setSelectedElement(null);
      setEditorSaveStatus('unsaved_changes');
      return newPages;
    });
    toast({ title: "Component Removed", description: `Component removed from the editor. Save your changes.` });
  };
  
  const duplicateSelectedElement = () => {
    if (!selectedElement) return;

    const duplicateRecursive = (element: IPageComponent): IPageComponent => {
      const newElement = JSON.parse(JSON.stringify(element));
      newElement._id = newObjectId();
      if (newElement.config?.elements) {
        newElement.config.elements = newElement.config.elements.map(duplicateRecursive);
      }
      if (newElement.config?.columns) {
        newElement.config.columns = newElement.config.columns.map((col: any) => ({
          ...col,
          id: newObjectId(), // Give new column a new drop zone id
          elements: col.elements ? col.elements.map(duplicateRecursive) : []
        }));
      }
      return newElement;
    };
    
    const newElement = duplicateRecursive(selectedElement);

    setCurrentPages(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages));
        const page = newPages[activePageIndex];
        if (!page) return newPages;

        let inserted = false;
        const insertRecursive = (elements: IPageComponent[]): IPageComponent[] => {
            const index = elements.findIndex(el => el._id === selectedElement._id);
            if (index !== -1) {
                elements.splice(index + 1, 0, newElement);
                inserted = true;
                return elements;
            }
            return elements.map(el => {
                if (inserted) return el;
                if (el.config?.elements) el.config.elements = insertRecursive(el.config.elements);
                if (el.config?.columns) el.config.columns.forEach((c: any) => { if (c.elements) c.elements = insertRecursive(c.elements); });
                return el;
            });
        };

        page.elements = insertRecursive(page.elements);
        setEditorSaveStatus('unsaved_changes');
        return newPages;
    });

    toast({ title: "Component Duplicated", description: `Component duplicated. Save your changes.` });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggedItem(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    setCurrentPages(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages)); // Deep copy for mutable operations

        const findElementAndParentList = (pages: IWebsiteVersionPage[], elementId: string): { list: IPageComponent[]; index: number; element: IPageComponent } | null => {
            for (const page of pages) {
                const queue: { list: IPageComponent[] }[] = [{ list: page.elements }];
                while (queue.length > 0) {
                    const { list } = queue.shift()!;
                    const index = list.findIndex(el => el._id === elementId);
                    if (index !== -1) return { list, index, element: list[index] };

                    for (const el of list) {
                        if (el.type === 'section' && el.config?.elements) queue.push({ list: el.config.elements });
                        else if (el.type === 'columns' && Array.isArray(el.config?.columns)) {
                            el.config.columns.forEach((col: any) => {
                                if (col.elements) queue.push({ list: col.elements });
                            });
                        }
                    }
                }
            }
            return null;
        };

        const findContainerList = (pages: IWebsiteVersionPage[], containerId: string): IPageComponent[] | null => {
            const activePage = pages[activePageIndex];
            if (!activePage) return null;
            if (containerId === 'canvas-drop-area') return activePage.elements;

            const queue: IPageComponent[] = [...activePage.elements];
            while (queue.length > 0) {
                const el = queue.shift()!;
                if (el.config.id === containerId && (el.type === 'section' || el.type === 'columns')) {
                   if (el.type === 'section') return el.config.elements;
                }
                if (el.type === 'columns' && Array.isArray(el.config?.columns)) {
                    for (let i = 0; i < el.config.columns.length; i++) {
                        if (el.config.columns[i].id === containerId) return el.config.columns[i].elements;
                        if (el.config.columns[i].elements) queue.push(...el.config.columns[i].elements);
                    }
                }
                if (el.type === 'section' && el.config.elements) queue.push(...el.config.elements);
            }
            return null;
        };

        // Case 1: Dropping a new item from the sidebar
        if (active.data.current?.isSidebarItem) {
            const componentType = active.data.current.type as string;
            const componentConfig = getComponentConfig(componentType);
            if (!componentConfig) return newPages;

            const newElement: IPageComponent = {
                _id: newObjectId(),
                type: componentType,
                label: componentConfig.label,
                config: JSON.parse(JSON.stringify(componentConfig.defaultConfig || {})),
                order: 0,
            };

            if (newElement.type === 'columns' && Array.isArray(newElement.config.columns)) {
                newElement.config.columns.forEach((col: any) => {
                    col.id = newObjectId();
                });
            }
             if (newElement.type === 'section') {
                newElement.config.id = newObjectId();
            }
            
            let targetList = findContainerList(newPages, overId);
            let dropIndex = -1;

            if (!targetList) {
                const overElementInfo = findElementAndParentList(newPages, overId);
                if (overElementInfo) {
                    targetList = overElementInfo.list;
                    dropIndex = overElementInfo.index + 1;
                }
            }

            if (targetList) {
                if (dropIndex === -1) dropIndex = targetList.length;
                targetList.splice(dropIndex, 0, newElement);
            }

        } else { // Case 2: Reordering an existing item
            const sourceInfo = findElementAndParentList(newPages, activeId);
            if (!sourceInfo) return newPages;
            
            const [movedElement] = sourceInfo.list.splice(sourceInfo.index, 1);

            let destinationList = findContainerList(newPages, overId);
            let destinationIndex = -1;
            
            if (destinationList) { // Dropped on a container
                destinationIndex = destinationList.length;
            } else { // Dropped on an element
                const overElementInfo = findElementAndParentList(newPages, overId);
                if (overElementInfo) {
                    destinationList = overElementInfo.list;
                    destinationIndex = overElementInfo.index;
                }
            }
            
            if (destinationList) {
                destinationList.splice(destinationIndex, 0, movedElement);
            } else { // Fallback: drop back to original list
                sourceInfo.list.splice(sourceInfo.index, 0, movedElement);
            }
        }
        
        const reorderRecursively = (elements: IPageComponent[]) => {
            elements.forEach((el, index) => {
                el.order = index;
                if (el.type === 'section' && el.config.elements) reorderRecursively(el.config.elements);
                if (el.type === 'columns' && Array.isArray(el.config.columns)) {
                    el.config.columns.forEach((col: any) => reorderRecursively(col.elements || []));
                }
            });
        };
        newPages.forEach(page => reorderRecursively(page.elements));

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
      const result = await createNavigation({ name: newNavigationName, websiteId, items: [] });
      if (result.success && result.data) {
        toast({ title: "Navigation Created", description: `Navigation "${result.data.name}" added.` });
        setNewNavigationName("");
        await fetchSiteNavigations(websiteId);
      } else {
        toast({ title: "Error", description: result.error || "Failed to create navigation.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create navigation.", variant: "destructive" });
    } finally {
      setIsNavigationsLoading(false);
    }
  };

  const handleDeleteNavigation = async () => {
    if (!navigationToDeleteId || !websiteId) return;
    setIsNavigationsLoading(true);
    try {
      const result = await deleteNavigation(navigationToDeleteId);
      if (result.success) {
        toast({ title: "Navigation Deleted", description: `Navigation has been removed.` });
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
        setEditorSaveStatus('unsaved_changes');
        await fetchSiteNavigations(websiteId);
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete navigation.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not delete navigation.", variant: "destructive" });
    } finally {
      setIsNavigationsLoading(false);
      setShowNavDeleteConfirm(false);
      setNavigationToDeleteId(null);
    }
  };

  const handleSaveNavigationChanges = async () => {
    if (!selectedNavigationForEditing?._id) return;
    setIsNavigationsLoading(true);
    const result = await updateNavigation({
      navigationId: selectedNavigationForEditing._id as string,
      name: editingNavName,
      items: editingNavItems.map(({label, url, type}) => ({label, url, type})),
    });
    if (result.success && result.data) {
      toast({ title: "Navigation Saved", description: `"${result.data?.name}" has been updated.`});
      await fetchSiteNavigations(websiteId);
      setSelectedNavigationForEditing(null);
      setEditingNavItems([]);
      setEditingNavName("");
    } else {
      toast({ title: "Error", description: result.error || "Failed to save navigation.", variant: "destructive" });
    }
    setIsNavigationsLoading(false);
  };
  
  const handleEditingNavItemChange = (index: number, field: keyof INavigationItem, value: string) => {
    setEditingNavItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
    });
  };

  const handleAddEditingNavItem = () => {
    setEditingNavItems(prev => [...prev, { label: "New Link", url: "#", type: "internal" }]);
  };
  
  const handleDeleteEditingNavItem = (index: number) => {
    setEditingNavItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiPromptSubmit = async (prompt: string): Promise<string | null> => {
    if (!websiteId) {
        toast({ title: "No Website Selected", description: "Please save your website first before using the AI assistant.", variant: "destructive"});
        return "I can't edit until the website is saved. Please save your work first.";
    }

    setIsAiProcessing(true);

    try {
        const input: EditWebsiteInput = {
            prompt,
            currentPages: getEditorContentForSave(),
            activePageSlug: currentPages[activePageIndex]?.slug || '/',
        };

        const result = await editWebsite(input);

        if (result.modifiedPages) {
            const sanitizedPages = result.modifiedPages.map(p => ({
                ...p,
                _id: (p._id || newObjectId()).toString(),
                elements: (p.elements || []).map(el => ({
                ...el,
                _id: (el._id || newObjectId()).toString(),
                }))
            })) as IWebsiteVersionPage[];
            
            setCurrentPages(sanitizedPages);
            setEditorSaveStatus('unsaved_changes');
            setSelectedElement(null);
            toast({ title: "AI Assistant", description: result.explanation });
            return result.explanation;
        } else {
             toast({ title: "AI Assistant", description: "The AI did not return a valid page structure.", variant: "destructive"});
            return "Sorry, I couldn't process that request properly.";
        }
    } catch (error: any) {
        console.error("AI editing error:", error);
        toast({ title: "AI Error", description: error.message, variant: "destructive" });
        return "An error occurred while I was trying to make changes.";
    } finally {
        setIsAiProcessing(false);
    }
  };

  const renderPropertyFields = () => {
    const activePageData = currentPages[activePageIndex];

    const renderFieldsRecursive = (configObject: any, pathPrefix = '') => {
        return Object.entries(configObject).map(([key, value]) => {
            if (key === 'id' || key === 'elements' || key === 'columns' || key.toLowerCase().includes('dataaihint')) return null;
            const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

            if (Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                return renderFieldsForArray(value, currentPath, key);
            }
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return (
                    <div key={currentPath} className="p-3 border rounded-md space-y-3 bg-muted/50 mt-2">
                        <p className="text-sm font-semibold capitalize text-muted-foreground">{key}</p>
                        <div className="pl-2 border-l-2 border-border space-y-3">{renderFieldsRecursive(value, currentPath)}</div>
                    </div>
                );
            }
            return <RenderPropertyField key={currentPath} propKey={key} propValue={value} path={currentPath} />;
        });
    };
    
    const renderFieldsForArray = (arr: any[], path: string, label: string) => {
        const handleAddItem = () => {
            const newItem = arr.length > 0 ? JSON.parse(JSON.stringify(arr[0])) : {};
            Object.keys(newItem).forEach(key => {
                if (typeof newItem[key] === 'string') newItem[key] = `New ${key}`;
                if (typeof newItem[key] === 'number') newItem[key] = 0;
                if (typeof newItem[key] === 'boolean') newItem[key] = false;
                if (key.toLowerCase().includes('image')) newItem[key] = 'https://placehold.co/300x200.png';
            });
            handlePropertyChange(path, [...arr, newItem]);
        };
        
        const handleRemoveItem = (index: number) => {
            const newArray = arr.filter((_, i) => i !== index);
            handlePropertyChange(path, newArray);
        };
    
        return (
            <div key={path} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground capitalize border-b pb-1 mb-2">{label.replace(/_/g, ' ')}</h4>
                {arr.map((item, index) => (
                    <div key={`${path}.${index}`} className="p-3 border rounded-md space-y-3 bg-card relative">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-semibold">Item {index + 1}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                        </div>
                        <div className="pl-2 border-l-2 border-border space-y-3">
                            {renderFieldsRecursive(item, `${path}.${index}`)}
                        </div>
                    </div>
                ))}
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleAddItem}>
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Item
                </Button>
            </div>
        );
    };

    const RenderPropertyField = ({ propKey, propValue, path }: { propKey: string; propValue: any; path: string }) => {
        const label = propKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (propKey === 'navigationId') {
            return (
                <div key={path}>
                    <Label htmlFor={path} className="text-xs">{label}</Label>
                    <Select value={propValue || ''} onValueChange={(val) => handlePropertyChange(path, val)}>
                        <SelectTrigger className="text-xs h-8 bg-input"><SelectValue placeholder="Select a navigation" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {allSiteNavigations.map(nav => (
                                <SelectItem key={nav._id as string} value={nav._id as string}>{nav.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (propKey.toLowerCase().includes('color')) {
            return (
                <div key={path} className="flex items-center justify-between">
                    <Label htmlFor={path} className="text-xs">{label}</Label>
                    <Input type="color" id={path} value={propValue || '#000000'} onChange={(e) => handlePropertyChange(path, e.target.value)} className="w-16 h-8 p-1 bg-input" />
                </div>
            );
        }

        if (propKey === 'src' || propKey.toLowerCase().includes('imageurl') || propKey.toLowerCase().includes('backgroundimage') || propKey.toLowerCase().includes('avatar')) {
            return (
                <div key={path}>
                    <Label htmlFor={path} className="text-xs">{label}</Label>
                    <div className="flex gap-2">
                        <Input type="text" id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs h-8 bg-input" />
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setUploadTargetKey(path); fileInputRef.current?.click(); }} disabled={isUploading}>
                            {isUploading && uploadTargetKey === path ? <Loader2 className="animate-spin h-4 w-4" /> : <UploadCloud className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
            );
        }

        if (propKey === 'level') {
            return (
                <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Select value={propValue || 'h2'} onValueChange={(val) => handlePropertyChange(path, val)}><SelectTrigger className="text-xs h-8 bg-input"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem></SelectContent></Select></div>
            );
        }

        if (propKey === 'alignment' || propKey === 'textAlign') {
            return (
                <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Select value={propValue || 'left'} onValueChange={(val) => handlePropertyChange(path, val)}><SelectTrigger className="text-xs h-8 bg-input capitalize"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div>
            );
        }
        
        if (typeof propValue === 'string' && (propValue.length > 50 || propValue.includes('\n'))) {
           return (
                <div key={path}>
                    <Label htmlFor={path} className="text-xs">{label}</Label>
                    <Textarea id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs bg-input" rows={5} />
                </div>
            );
        }

        if (typeof propValue === 'boolean') {
            return (
                <div key={path} className="flex items-center justify-between rounded-md border p-2"><Label htmlFor={path} className="text-xs">{label}</Label><Switch id={path} checked={!!propValue} onCheckedChange={(checked) => handlePropertyChange(path, checked)} /></div>
            );
        }

        if (typeof propValue === 'string' || typeof propValue === 'number') {
            return (
                <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Input type={typeof propValue === 'number' ? 'number' : 'text'} id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs h-8 bg-input" /></div>
            );
        }

        return null;
    };

    if (selectedElement) {
        const componentMeta = getComponentConfig(selectedElement.type);
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-muted-foreground">Editing: <strong>{componentMeta?.label || selectedElement.type}</strong></p>
                    <div className="flex items-center">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={duplicateSelectedElement} title="Duplicate Component"><Copy className="h-3.5 w-3.5"/></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2" title="Delete Component"><Trash2 className="h-3.5 w-3.5"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the "{componentMeta?.label}" component from the canvas. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteSelectedElement} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                {renderFieldsRecursive(selectedElement.config)}
            </div>
        );
    } else if (activePageData) {
        if (selectedNavigationForEditing) {
            return (
                <Card><CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center"><NavigationIcon className="mr-2 h-4 w-4" />Edit Navigation</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedNavigationForEditing(null)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />Back
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="editingNavName" className="text-xs">Navigation Name</Label>
                        <Input id="editingNavName" value={editingNavName} onChange={(e) => setEditingNavName(e.target.value)} className="text-xs bg-input" />
                    </div>
                    <div className="space-y-2">
                        {editingNavItems.map((item, index) => (
                            <div key={index} className="p-2 border rounded bg-background shadow-sm space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-xxs text-muted-foreground">Link Item #{index + 1}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteEditingNavItem(index)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                </div>
                                <div><Label htmlFor={`edit-nav-text-${index}`} className="text-xxs">Label</Label><Input id={`edit-nav-text-${index}`} value={item.label} onChange={(e) => handleEditingNavItemChange(index, 'label', e.target.value)} className="text-xs h-8 bg-input" /></div>
                                <div><Label htmlFor={`edit-nav-url-${index}`} className="text-xxs">URL</Label><Input id={`edit-nav-url-${index}`} value={item.url} onChange={(e) => handleEditingNavItemChange(index, 'url', e.target.value)} className="text-xs h-8 bg-input" /></div>
                                <div><Label htmlFor={`edit-nav-type-${index}`} className="text-xxs">Type</Label>
                                    <Select value={item.type || 'internal'} onValueChange={(val) => handleEditingNavItemChange(index, 'type', val)}>
                                        <SelectTrigger className="text-xs h-8 bg-input"><SelectValue/></SelectTrigger>
                                        <SelectContent><SelectItem value="internal">Internal</SelectItem><SelectItem value="external">External</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleAddEditingNavItem} className="w-full mt-2 text-xs"><PlusCircle className="mr-1.5 h-3.5 w-3.5"/>Add Link Item</Button>
                    <Button size="sm" onClick={handleSaveNavigationChanges} disabled={isNavigationsLoading} className="w-full mt-2">{isNavigationsLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4 mr-2" />}Save Navigation Changes</Button>
                </CardContent></Card>
            );
        }
        return (
            <Tabs defaultValue="page-settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-auto">
                <TabsTrigger value="page-settings" className="text-xs px-2 py-1.5 h-auto">Page Settings</TabsTrigger>
                <TabsTrigger value="site-navigations" className="text-xs px-2 py-1.5 h-auto">Site Navigations</TabsTrigger>
            </TabsList>
            <TabsContent value="page-settings">
                <Card><CardHeader><CardTitle className="text-base font-semibold">Page: {activePageData.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div><Label htmlFor="pageName" className="text-xs">Page Name</Label><Input type="text" id="pageName" value={activePageData.name || ""} placeholder="Home" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, e.target.value, activePageData.slug, activePageData.seoTitle, activePageData.seoDescription)} /></div>
                    <div><Label htmlFor="pageSlug" className="text-xs">Slug</Label><Input type="text" id="pageSlug" value={activePageData.slug || ""} placeholder="/home" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, e.target.value, activePageData.seoTitle, activePageData.seoDescription)} /></div>
                    <div><Label htmlFor="seoTitle" className="text-xs">SEO Title</Label><Input type="text" id="seoTitle" value={activePageData.seoTitle || ""} placeholder="Page Title for SEO" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, e.target.value, activePageData.seoDescription)} /></div>
                    <div><Label htmlFor="seoDescription" className="text-xs">SEO Description</Label><Textarea id="seoDescription" value={activePageData.seoDescription || ""} placeholder="Page description for SEO" className="text-xs bg-input" rows={3} onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, activePageData.seoTitle, e.target.value)} /></div>
                </CardContent></Card>
            </TabsContent>
            <TabsContent value="site-navigations">
                <Card><CardHeader><CardTitle className="text-base font-semibold flex items-center"><NavigationIcon className="mr-2 h-4 w-4" />Manage Site Navigations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label htmlFor="newNavigationName" className="text-xs">Create New Navigation</Label>
                    <div className="flex gap-2 mt-1">
                        <Input id="newNavigationName" value={newNavigationName} onChange={(e) => setNewNavigationName(e.target.value)} placeholder="e.g., Main Menu" className="text-xs bg-input" disabled={!websiteId || isNavigationsLoading} />
                        <Button size="sm" onClick={handleCreateNavigation} disabled={!websiteId || isNavigationsLoading || !newNavigationName.trim()}>{isNavigationsLoading && newNavigationName ? <Loader2 className="animate-spin h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}</Button>
                    </div>
                    </div>
                    {isNavigationsLoading && !allSiteNavigations.length ? <div className="text-xs text-muted-foreground py-2">Loading...</div> : allSiteNavigations.length === 0 ? <p className="text-xs text-muted-foreground py-2">No navigations created yet.</p> : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {allSiteNavigations.map(nav => (
                        <div key={nav._id as string} className="flex items-center justify-between p-2 border rounded-md bg-input/30">
                            <span className="text-xs font-medium truncate" title={nav.name}>{nav.name}</span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedNavigationForEditing(nav); setEditingNavName(nav.name); setEditingNavItems(nav.items); }}><Edit className="h-3.5 w-3.5"/></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setNavigationToDeleteId(nav._id as string); setShowNavDeleteConfirm(true); }}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                            </div>
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
        <Card className="max-w-md text-center"><CardHeader><CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2" />Error: Website Not Specified</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">No website ID was provided. Select a website from your dashboard.</p><Button asChild className="mt-6"><a href="/dashboard">Go to Dashboard</a></Button></CardContent></Card>
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
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveDraggedItem(event.active)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} websiteId={websiteId} editorSaveStatus={editorSaveStatus} onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)} onOpenTemplateGalleryModal={() => setIsTemplateGalleryModalOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <ComponentLibrarySidebar />
          <main className="flex-1 flex flex-col p-1 md:p-2 lg:p-4 overflow-hidden bg-muted/30">
            <div className="flex justify-between items-center p-2 border-b bg-card mb-2 gap-3">
              <div className="overflow-x-auto">
                <Tabs value={activePageIndex.toString()} onValueChange={(value) => { setActivePageIndex(parseInt(value)); setSelectedElement(null); }} className="max-w-full">
                  <TabsList className="bg-transparent p-0 h-auto">
                    {currentPages.map((page, index) => (
                      <TabsTrigger key={page._id as string || index} value={index.toString()} className="text-xs px-2 py-1.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary">
                        {page.name}
                        {currentPages.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPageToDeleteIndex(index); setShowPageDeleteConfirm(true); }} className="ml-1.5 p-0.5 rounded hover:bg-destructive/20" aria-label={`Delete page ${page.name}`} title={`Delete page ${page.name}`}>
                              <X className="h-3 w-3 text-destructive/70 hover:text-destructive" />
                            </button>
                        )}
                      </TabsTrigger>
                    ))}
                    <Button variant="ghost" size="sm" onClick={handleAddNewPage} className="text-xs h-auto px-2 py-1.5 ml-1"><FilePlus className="mr-1 h-3.5 w-3.5" />Add Page</Button>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex items-center flex-shrink-0">
                {renderEditorSaveStatus()}
                <Button size="sm" onClick={handleEditorSaveChanges} disabled={editorSaveStatus === 'saving' || editorSaveStatus === 'saved' || editorSaveStatus === 'idle'}><Save className="mr-2 h-4 w-4" />Save Site</Button>
              </div>
            </div>
            <CanvasEditor devicePreview={currentDevice} page={currentEditorPage} pageIndex={activePageIndex} onElementSelect={handleElementSelect} isDragging={!!activeDraggedItem} activeDragId={activeDraggedItem?.id as string | null} selectedElementId={selectedElement?._id as string | null}/>
          </main>
          <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
            <Card className="flex-1"><CardHeader><CardTitle className="font-headline text-lg flex items-center">{selectedElement ? <><MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />Properties</> : <><Settings className="w-5 h-5 mr-2 text-primary" />Page & Site Settings</>}</CardTitle></CardHeader>
              <CardContent><div className="space-y-4">{renderPropertyFields()}</div>{selectedElement && <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)} className="mt-4">Deselect Element</Button>}</CardContent></Card>
          </aside>
        </div>
        
        <AiChatAssistant onPromptSubmit={handleAiPromptSubmit} isProcessing={isAiProcessing} />

        {websiteId && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen} currentDesignData={getEditorContentForSave()} />}
        <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} onApplyTemplate={handleApplyTemplate} />
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

        <AlertDialog open={showPageDeleteConfirm} onOpenChange={setShowPageDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will delete the page "{pageToDeleteIndex !== null ? currentPages[pageToDeleteIndex]?.name : ''}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowPageDeleteConfirm(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeletePage} className="bg-destructive hover:bg-destructive/90">Delete Page</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showNavDeleteConfirm} onOpenChange={setShowNavDeleteConfirm}>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Navigation?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the navigation: "{allSiteNavigations.find(n => n._id === navigationToDeleteId)?.name || ''}"? This cannot be undone and may affect Navbars using it.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setShowNavDeleteConfirm(false)} disabled={isNavigationsLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteNavigation} className="bg-destructive hover:bg-destructive/90" disabled={isNavigationsLoading}>{isNavigationsLoading ? <Loader2 className="animate-spin h-4 w-4"/> : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
}
