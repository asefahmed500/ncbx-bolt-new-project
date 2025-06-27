
// src/hooks/useEditor.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { IWebsite, SaveWebsiteContentInput } from '@/models/Website';
import type { IWebsiteVersion, IWebsiteVersionPage, IPageComponent } from '@/models/WebsiteVersion';
import type { INavigation, INavigationItem } from '@/models/Navigation';
import { getWebsiteEditorData, saveWebsiteContent } from '@/actions/website';
import { createNavigation, getNavigationsByWebsiteId, updateNavigation, deleteNavigation } from '@/actions/navigation';
import { getComponentConfig } from '@/components/editor/componentRegistry';
import { type Active, type DragEndEvent } from '@dnd-kit/core';

export type EditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved_changes';

const newObjectId = () => Math.random().toString(36).substring(2, 15);

const defaultInitialPage: IWebsiteVersionPage = {
  _id: newObjectId(),
  name: "Home",
  slug: "/",
  elements: [],
  seoTitle: "Home Page",
  seoDescription: "Welcome to your new site!",
};

export interface SelectedElementData extends IPageComponent {
  pageIndex: number;
  elementIndex: number;
}

export function useEditor() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const websiteIdFromQuery = searchParams.get('websiteId');

  const [websiteId, setWebsiteId] = useState<string | null>(websiteIdFromQuery);
  const [websiteData, setWebsiteData] = useState<IWebsite | null>(null);
  
  const [currentPages, setCurrentPages] = useState<IWebsiteVersionPage[]>([JSON.parse(JSON.stringify(defaultInitialPage))]);
  const [globalSettings, setGlobalSettings] = useState<IWebsiteVersion['globalSettings']>({});
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(true);
  const [editorSaveStatus, setEditorSaveStatus] = useState<EditorSaveStatus>('idle');
  
  const [history, setHistory] = useState<IWebsiteVersionPage[][]>([JSON.parse(JSON.stringify([defaultInitialPage]))]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [activeDraggedItem, setActiveDraggedItem] = useState<Active | null>(null);
  
  const [allSiteNavigations, setAllSiteNavigations] = useState<INavigation[]>([]);
  const [isNavigationsLoading, setIsNavigationsLoading] = useState(false);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      if (!websiteIdFromQuery) {
        setIsLoadingWebsite(false);
        const initialPages = [JSON.parse(JSON.stringify(defaultInitialPage))];
        setWebsiteData(null);
        setCurrentPages(initialPages);
        setGlobalSettings({});
        setActivePageIndex(0);
        setSelectedElement(null);
        setAllSiteNavigations([]);
        setHistory([initialPages]);
        setHistoryIndex(0);
        return;
      }

      setIsLoadingWebsite(true);
      setSelectedElement(null);
      setWebsiteId(websiteIdFromQuery);

      try {
        const result = await getWebsiteEditorData(websiteIdFromQuery);
        if (ignore) return;

        if (result.error) throw new Error(result.error);

        if (result.website) {
          setWebsiteData(result.website);

          // Fetch navigations
          setIsNavigationsLoading(true);
          const navResult = await getNavigationsByWebsiteId(websiteIdFromQuery);
           if (ignore) return;
          if (navResult.success && navResult.data) {
            setAllSiteNavigations(navResult.data);
          } else {
            setAllSiteNavigations([]);
            if (navResult.error) toast({ title: "Error", description: navResult.error, variant: "destructive" });
          }
          setIsNavigationsLoading(false);

          let initialPages: IWebsiteVersionPage[] = [JSON.parse(JSON.stringify(defaultInitialPage))];
          if (result.currentVersion) {
            const pages = result.currentVersion.pages;
            if (pages && pages.length > 0) {
              initialPages = pages.map(p => ({
                ...p,
                _id: (p._id || newObjectId()).toString(),
                elements: p.elements.map(el => ({ ...el, _id: (el._id || newObjectId()).toString() }))
              })) as IWebsiteVersionPage[];
            }
            setGlobalSettings(result.currentVersion.globalSettings || {});
          } else {
            setGlobalSettings({});
          }

          const initialPagesCopy = JSON.parse(JSON.stringify(initialPages));
          setCurrentPages(initialPagesCopy);
          setHistory([initialPagesCopy]);
          setHistoryIndex(0);
          setActivePageIndex(0);
          setEditorSaveStatus('saved');
        }
      } catch (err: any) {
        if (ignore) return;
        const initialPages = [JSON.parse(JSON.stringify(defaultInitialPage))];
        toast({ title: "Error Loading Website", description: err.message, variant: "destructive" });
        setWebsiteData(null);
        setCurrentPages(initialPages);
        setGlobalSettings({});
        setActivePageIndex(0);
        setAllSiteNavigations([]);
        setHistory([initialPages]);
        setHistoryIndex(0);
      } finally {
        if (!ignore) {
          setIsLoadingWebsite(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [websiteIdFromQuery, toast]);


  const updatePagesWithHistory = useCallback((pagesUpdater: (prevPages: IWebsiteVersionPage[]) => IWebsiteVersionPage[], actionName?: string) => {
    const newPages = pagesUpdater(currentPages);
    const pagesCopy = JSON.parse(JSON.stringify(newPages));

    setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(pagesCopy);
        return newHistory;
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
    
    setCurrentPages(pagesCopy);
    setEditorSaveStatus('unsaved_changes');
  }, [currentPages, historyIndex]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPages(JSON.parse(JSON.stringify(history[newIndex])));
      setSelectedElement(null);
      setEditorSaveStatus('unsaved_changes');
    }
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPages(JSON.parse(JSON.stringify(history[newIndex])));
      setSelectedElement(null);
      setEditorSaveStatus('unsaved_changes');
    }
  }, [canRedo, history, historyIndex]);
  
  const findElementRecursive = useCallback((elements: IPageComponent[], elementId: string): { element: IPageComponent, parentList: IPageComponent[] } | null => {
    for (const el of elements) {
        if (el._id === elementId) return { element: el, parentList: elements };
        if (el.config?.elements && Array.isArray(el.config.elements)) { const found = findElementRecursive(el.config.elements, elementId); if (found) return found; }
        if (el.config?.columns && Array.isArray(el.config.columns)) { for (const col of el.config.columns) { if (col.elements && Array.isArray(col.elements)) { const found = findElementRecursive(col.elements, elementId); if (found) return found; } } }
    }
    return null;
  }, []);

  const handleElementSelect = useCallback((elementId: string, pageIndex: number) => {
    const page = currentPages[pageIndex];
    if (page) {
      const result = findElementRecursive(page.elements, elementId);
      if (result) {
        const elementIndex = result.parentList.findIndex(e => e._id === elementId);
        setSelectedElement({ ...result.element, pageIndex, elementIndex });
      }
    }
  }, [currentPages, findElementRecursive]);
  
  const handlePropertyChange = useCallback((path: string, value: any) => {
    updatePagesWithHistory(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages));
        if (!selectedElement) return newPages;
        const pageToUpdate = newPages[activePageIndex];
        if (!pageToUpdate) return newPages;
        let finalUpdatedElement: IPageComponent | null = null;
        const setDeepValue = (obj: any, pathString: string, valueToSet: any) => {
            const pathArray = pathString.match(/([^[.\]])+/g) || [];
            let current = obj;
            for (let i = 0; i < pathArray.length - 1; i++) {
                current = current[pathArray[i]];
            }
            current[pathArray[pathArray.length - 1]] = valueToSet;
        };
        const updateElementInList = (elements: IPageComponent[]): boolean => {
            for (let el of elements) {
                if (el._id === selectedElement._id) { setDeepValue(el.config, path, value); finalUpdatedElement = el; return true; }
                if (el.config?.elements && Array.isArray(el.config.elements)) { if (updateElementInList(el.config.elements)) return true; }
                if (el.config?.columns && Array.isArray(el.config.columns)) { for (const col of el.config.columns) { if (col.elements && Array.isArray(col.elements)) { if (updateElementInList(col.elements)) return true; } } }
            }
            return false;
        };
        updateElementInList(pageToUpdate.elements);
        if (finalUpdatedElement) {
            if (finalUpdatedElement.type === 'navbar' && path === 'navigationId') {
                const selectedNav = allSiteNavigations.find(nav => nav._id === value);
                if (selectedNav) { finalUpdatedElement.config.links = selectedNav.items.map(item => ({ text: item.label, href: item.url, type: item.type || 'internal' })); }
                else if (!value) { finalUpdatedElement.config.links = getComponentConfig('navbar')?.defaultConfig?.links || []; }
            }
            setSelectedElement(prevSel => prevSel ? { ...prevSel, config: JSON.parse(JSON.stringify(finalUpdatedElement!.config)) } : null);
        }
        return newPages;
    });
  }, [selectedElement, activePageIndex, updatePagesWithHistory, allSiteNavigations]);

  const handlePageDetailsChange = useCallback((pageId: string, newName: string, newSlug: string, seoTitle?: string, seoDescription?: string) => {
    updatePagesWithHistory(prev => prev.map(p => p._id === pageId ? {...p, name: newName, slug: newSlug, seoTitle, seoDescription } : p));
  }, [updatePagesWithHistory]);

  const handleGlobalSettingsChange = useCallback((key: keyof NonNullable<IWebsiteVersion['globalSettings']>, value: any) => {
      setGlobalSettings(prev => ({ ...prev, [key]: value }));
      setEditorSaveStatus('unsaved_changes');
  }, []);

  const handleAddNewPage = useCallback(() => {
    const newPageBaseName = "New Page";
    let newPageName = newPageBaseName;
    let counter = 1;
    const existingPageNames = currentPages.map(p => p.name);
    while (existingPageNames.includes(newPageName)) { newPageName = `${newPageBaseName} ${counter++}`; }
    const newPage: IWebsiteVersionPage = { _id: newObjectId(), name: newPageName, slug: `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`, elements: [] };
    updatePagesWithHistory(prev => [...prev, newPage], "Add Page");
    setActivePageIndex(currentPages.length);
    setSelectedElement(null);
    toast({ title: "Page Added", description: `Page "${newPage.name}" created. Don't forget to save.` });
  }, [currentPages, updatePagesWithHistory, toast, setActivePageIndex, setSelectedElement]);

  const getEditorContentForSave = useCallback((): SaveWebsiteContentInput['pages'] => {
    const reorderAndClean = (elements: IPageComponent[]): any[] => {
        return elements.map((el, index) => ({
            _id: el._id as string, type: el.type,
            config: el.type === 'section' ? { ...el.config, elements: reorderAndClean(el.config.elements || []) } : 
                    el.type === 'columns' ? { ...el.config, columns: el.config.columns.map((c: any) => ({ ...c, elements: reorderAndClean(c.elements || [])})) } :
                    el.config,
            order: index
        }));
    };
    return currentPages.map(page => ({
      _id: page._id as string, name: page.name, slug: page.slug,
      elements: reorderAndClean(page.elements),
      seoTitle: page.seoTitle, seoDescription: page.seoDescription
    }));
  }, [currentPages]);

  const handleEditorSaveChanges = async () => {
    if (!websiteId) { toast({ title: "Error", description: "No website ID available to save changes.", variant: "destructive" }); return; }
    setEditorSaveStatus('saving');
    const contentToSave: SaveWebsiteContentInput = { websiteId, pages: getEditorContentForSave(), globalSettings };
    try {
      const result = await saveWebsiteContent(contentToSave);
      if (result.success && result.website && result.versionId) {
        setEditorSaveStatus('saved');
        setWebsiteData(result.website);
        const savedPagesCopy = JSON.parse(JSON.stringify(getEditorContentForSave()));
        setHistory([savedPagesCopy]);
        setHistoryIndex(0);
        toast({ title: "Changes Saved!", description: "Your website content has been updated." });
      } else { setEditorSaveStatus('error'); toast({ title: "Save Failed", description: result.error || "Could not save changes.", variant: "destructive" }); }
    } catch (error: any) { setEditorSaveStatus('error'); toast({ title: "Save Error", description: error.message || "An unexpected error occurred.", variant: "destructive" }); }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggedItem(null);
    if (!over || active.id === over.id) return;
    updatePagesWithHistory(prevPages => {
      const newPages = JSON.parse(JSON.stringify(prevPages));
      const findAndRemove = (elementId: string, elements: IPageComponent[]): [IPageComponent, IPageComponent[]] | [null, IPageComponent[]] => {
        const index = elements.findIndex(el => el._id === elementId);
        if (index !== -1) { const found = elements[index]; elements.splice(index, 1); return [found, elements]; }
        for (const el of elements) {
          if (el.config?.elements) { const [found, updated] = findAndRemove(elementId, el.config.elements); if (found) { el.config.elements = updated; return [found, elements]; } }
          if (el.config?.columns) { for (const col of el.config.columns) { if (col.elements) { const [found, updated] = findAndRemove(elementId, col.elements); if (found) { col.elements = updated; return [found, elements]; } } } }
        }
        return [null, elements];
      };
      const insertElement = (movedElement: IPageComponent, elements: IPageComponent[], targetId: string, isSidebarItem: boolean): boolean => {
        if (!isSidebarItem && targetId === 'canvas-drop-area') { elements.push(movedElement); return true; }
        const index = elements.findIndex(el => el._id === targetId);
        if (index !== -1) { elements.splice(isSidebarItem ? index : index + 1, 0, movedElement); return true; }
        for (const el of elements) {
          if (el.config?.elements && insertElement(movedElement, el.config.elements, targetId, isSidebarItem)) return true;
          if (el.config?.columns) { for (const col of el.config.columns) { if (col.id === targetId) { col.elements.push(movedElement); return true; } if (col.elements && insertElement(movedElement, col.elements, targetId, isSidebarItem)) return true; } }
          if (el.config?.id === targetId && el.type === 'section') { el.config.elements.push(movedElement); return true; }
        }
        return false;
      };
      const activeIsSidebarItem = active.data.current?.isSidebarItem ?? false;
      if (activeIsSidebarItem) {
        const componentType = active.data.current.type as string;
        const componentConfig = getComponentConfig(componentType);
        if (!componentConfig) return newPages;
        const newElement: IPageComponent = { _id: newObjectId(), type: componentType, label: componentConfig.label, config: JSON.parse(JSON.stringify(componentConfig.defaultConfig || {})), order: 0 };
        if (newElement.type === 'columns' && Array.isArray(newElement.config.columns)) newElement.config.columns.forEach((col: any) => { col.id = newObjectId(); });
        if (newElement.type === 'section') newElement.config.id = newObjectId();
        const pageToUpdate = newPages[activePageIndex];
        if (insertElement(newElement, pageToUpdate.elements, over.id.toString(), true)) return newPages;
        pageToUpdate.elements.push(newElement); // Fallback to add to canvas root
      } else {
        const page = newPages[activePageIndex];
        const [movedElement, updatedElements] = findAndRemove(active.id.toString(), page.elements);
        if (movedElement) {
          page.elements = updatedElements;
          if (!insertElement(movedElement, page.elements, over.id.toString(), false)) { page.elements.push(movedElement); }
        }
      }
      return newPages;
    }, "Drag & Drop");
  };

  const createNav = async (name: string) => {
    if (!websiteId) return { success: false, error: 'Website ID not found' };
    return await createNavigation({ websiteId, name });
  };
  const updateNav = async (id: string, name: string, items: INavigationItem[]) => {
    return await updateNavigation({ navigationId: id, name, items });
  };
  const deleteNav = async (id: string) => {
    return await deleteNavigation(id);
  };
  
  return {
    websiteId, websiteData, currentPages, setCurrentPages, globalSettings, setGlobalSettings,
    activePageIndex, setActivePageIndex, selectedElement, setSelectedElement,
    isLoadingWebsite, editorSaveStatus, setEditorSaveStatus, history, historyIndex,
    canUndo, canRedo, handleUndo, handleRedo, updatePagesWithHistory, allSiteNavigations,
    setAllSiteNavigations, isNavigationsLoading, setIsNavigationsLoading,
    handlePropertyChange, handlePageDetailsChange, handleGlobalSettingsChange, handleAddNewPage,
    getEditorContentForSave, handleEditorSaveChanges, handleDragEnd, activeDraggedItem,
    setActiveDraggedItem, handleElementSelect,
    createNavigation: createNav, updateNavigation: updateNav, deleteNavigation: deleteNav,
  };
}
