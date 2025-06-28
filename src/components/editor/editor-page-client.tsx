
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useEditor } from '@/hooks/useEditor';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trash2, Wand2 as Wand2Icon } from 'lucide-react';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AiChatAssistant } from './ai-chat-assistant';
import { editWebsite, type EditWebsiteInput } from '@/ai/flows/edit-website-flow';
import { logAiInteraction } from '@/actions/logging';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './editor-toolbar';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion';
import type { ITemplate } from '@/models/Template';
import { updateNavigation } from '@/actions/navigation';
import { getComponentConfig } from './componentRegistry';

const newObjectId = () => Math.random().toString(36).substring(2, 15);

export default function EditorPageComponent() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const editorState = useEditor();
  const {
    websiteId,
    currentPages,
    globalSettings,
    activePageIndex,
    selectedElement,
    isLoadingWebsite,
    editorSaveStatus,
    allSiteNavigations,
    setAllSiteNavigations,
    activeDraggedItem,
    canUndo,
    canRedo,
    aiUsageCount,
    AI_USAGE_LIMIT_FREE,
    setAiUsageCount,
    setActivePageIndex,
    setSelectedElement,
    updatePagesWithHistory,
    handleUndo,
    handleRedo,
    handleElementSelect,
    handleDragEnd,
    setActiveDraggedItem,
    getEditorContentForSave,
    handleEditorSaveChanges,
    handleAddNewPage,
    handlePropertyChange,
    handlePageDetailsChange,
    handleGlobalSettingsChange,
    fetchSiteNavigations,
  } = editorState;

  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const [pageToDeleteIndex, setPageToDeleteIndex] = useState<number | null>(null);
  const [showPageDeleteConfirm, setShowPageDeleteConfirm] = useState(false);
  const [pageToClearIndex, setPageToClearIndex] = useState<number | null>(null);
  const [showClearPageConfirm, setShowClearPageConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [navigationToDeleteId, setNavigationToDeleteId] = useState<string | null>(null);
  
  const confirmDeletePage = async () => {
    if (pageToDeleteIndex === null) return;
    if (currentPages.length <= 1) {
      toast({ title: "Cannot Delete Page", description: "You must have at least one page.", variant: "destructive" });
      setShowPageDeleteConfirm(false); setPageToDeleteIndex(null); return;
    }
    const pageToDelete = currentPages[pageToDeleteIndex];
    const deletedSlug = pageToDelete.slug;
    updatePagesWithHistory(prev => prev.filter((_, index) => index !== pageToDeleteIndex), "Delete Page");
    const navUpdatePromises = allSiteNavigations.map(nav => {
      const newItems = nav.items.filter(item => !(item.type === 'internal' && item.url === deletedSlug));
      if (newItems.length < nav.items.length) {
        return updateNavigation({ navigationId: nav._id as string, items: newItems.map(({ label, url, type }) => ({ label, url, type })), });
      }
      return null;
    }).filter(Boolean);
    if (navUpdatePromises.length > 0) {
      await Promise.all(navUpdatePromises);
      toast({ title: "Navigations Updated", description: "Removed links to the deleted page." });
      if (websiteId) {
        await fetchSiteNavigations(websiteId);
      }
    }
    setActivePageIndex(Math.max(0, pageToDeleteIndex - 1));
    setSelectedElement(null); setPageToDeleteIndex(null); setShowPageDeleteConfirm(false);
    toast({ title: "Page Removed", description: `Page "${pageToDelete.name}" was removed. Save changes to persist.` });
  };

  const handleClearPage = () => {
    if (pageToClearIndex === null) return;
    const pageToClear = currentPages[pageToClearIndex];
    if (!pageToClear.elements || pageToClear.elements.length === 0) {
      toast({ title: "Page is Already Empty", description: `The page "${pageToClear.name}" has no components to clear.` });
      setShowClearPageConfirm(false); setPageToClearIndex(null); return;
    }
    updatePagesWithHistory(prev => {
        const newPages = [...prev];
        newPages[pageToClearIndex] = { ...newPages[pageToClearIndex], elements: [] };
        return newPages;
    }, "Clear Page");
    if (activePageIndex === pageToClearIndex) { setSelectedElement(null); }
    toast({ title: "Page Cleared", description: `All components from "${pageToClear.name}" have been removed. Save your changes.` });
    setShowClearPageConfirm(false); setPageToClearIndex(null);
  };
  
  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    updatePagesWithHistory(prevPages => {
      const newPages = JSON.parse(JSON.stringify(prevPages));
      const page = newPages[activePageIndex];
      if (!page) return newPages;
      const deleteRecursive = (elements: IPageComponent[]): IPageComponent[] => {
        return elements.reduce((acc: IPageComponent[], el) => {
          if (el._id === selectedElement._id) return acc;
          const newEl = { ...el };
          if (newEl.config?.elements) newEl.config = { ...newEl.config, elements: deleteRecursive(newEl.config.elements) };
          if (newEl.config?.columns) newEl.config = { ...newEl.config, columns: newEl.config.columns.map((c: any) => ({ ...c, elements: c.elements ? deleteRecursive(c.elements) : [] })) };
          acc.push(newEl);
          return acc;
        }, []);
      };
      page.elements = deleteRecursive(page.elements);
      setSelectedElement(null);
      return newPages;
    }, "Delete Component");
    toast({ title: "Component Removed", description: `Component removed. Save your changes.` });
  };
  
  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const duplicateRecursive = (element: IPageComponent): IPageComponent => {
      const newElement = JSON.parse(JSON.stringify(element));
      newElement._id = newObjectId();
      if (newElement.config?.elements) newElement.config.elements = newElement.config.elements.map(duplicateRecursive);
      if (newElement.config?.columns) newElement.config.columns = newElement.config.columns.map((col: any) => ({...col, id: newObjectId(), elements: col.elements ? col.elements.map(duplicateRecursive) : [] }));
      return newElement;
    };
    const newElement = duplicateRecursive(selectedElement);
    updatePagesWithHistory(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages));
        const page = newPages[activePageIndex];
        if (!page) return newPages;
        let inserted = false;
        const insertRecursive = (elements: IPageComponent[]): IPageComponent[] => {
            const index = elements.findIndex(el => el._id === selectedElement._id);
            if (index !== -1) { elements.splice(index + 1, 0, newElement); inserted = true; return elements; }
            return elements.map(el => {
                if (inserted) return el;
                if (el.config?.elements) el.config.elements = insertRecursive(el.config.elements);
                if (el.config?.columns) el.config.columns.forEach((c: any) => { if (c.elements) c.elements = insertRecursive(c.elements); });
                return el;
            });
        };
        page.elements = insertRecursive(page.elements);
        return newPages;
    }, "Duplicate Component");
    toast({ title: "Component Duplicated", description: `Component duplicated. Save your changes.` });
  };
  
  const resetSelectedElementStyles = () => {
    if (!selectedElement) return;
    const componentConfig = getComponentConfig(selectedElement.type);
    if (!componentConfig?.defaultConfig) { toast({ title: "Cannot Reset", description: "This component has no default styles defined.", variant: "destructive" }); return; }
    const newConfig = JSON.parse(JSON.stringify(componentConfig.defaultConfig));
    updatePagesWithHistory(prevPages => {
        const newPages = JSON.parse(JSON.stringify(prevPages));
        const page = newPages[activePageIndex];
        if (!page) return newPages;
        let foundAndUpdated = false;
        const updateRecursive = (elements: IPageComponent[]): IPageComponent[] => {
            return elements.map(el => {
                if (foundAndUpdated) return el;
                if (el._id === selectedElement._id) { foundAndUpdated = true; return { ...el, config: newConfig }; }
                const newEl = { ...el };
                if (newEl.config?.elements) newEl.config = { ...newEl.config, elements: updateRecursive(newEl.config.elements) };
                if (newEl.config?.columns) newEl.config = { ...newEl.config, columns: newEl.config.columns.map((col: any) => ({ ...col, elements: col.elements ? updateRecursive(col.elements) : [] })) };
                return newEl;
            });
        };
        page.elements = updateRecursive(page.elements);
        return newPages;
    }, "Reset Component");
    setSelectedElement(prev => prev ? { ...prev, config: newConfig } : null);
    toast({ title: "Component Reset", description: `Component styles reset to defaults.` });
    setShowResetConfirm(false);
  };
  
  const handleApplyTemplate = useCallback((template: ITemplate) => {
    if (template.pages && template.pages.length > 0) {
      const newPagesWithIds = template.pages.map(p => ({ ...p, _id: newObjectId(), elements: p.elements.map(el => ({ ...el, _id: newObjectId() })) })) as IWebsiteVersionPage[];
      updatePagesWithHistory(() => newPagesWithIds, "Apply Template");
      setActivePageIndex(0);
      setSelectedElement(null);
      toast({ title: "Template Applied", description: `"${template.name}" has been applied. Use Undo to revert.` });
    } else toast({ title: "Empty Template", description: "Selected template has no content.", variant: "destructive" });
    setIsTemplateGalleryModalOpen(false);
  }, [toast, updatePagesWithHistory, setActivePageIndex, setSelectedElement]);

  const handleAiPromptSubmit = async (prompt: string): Promise<string | null> => {
    if (!websiteId) { toast({ title: "No Website Selected", description: "Please save your website first before using the AI assistant.", variant: "destructive"}); return "I can't edit until the website is saved. Please save your work first."; }
    
    const isPro = session?.user?.subscriptionPlanId === 'pro' || session?.user?.subscriptionPlanId === 'enterprise';
    if (!isPro && aiUsageCount >= AI_USAGE_LIMIT_FREE) {
        toast({
            title: "AI Usage Limit Reached",
            description: `You have used your ${AI_USAGE_LIMIT_FREE} free AI generations. Please upgrade to Pro for unlimited use.`,
            variant: "destructive",
            action: <AlertDialogAction onClick={() => router.push('/pricing')}>Upgrade</AlertDialogAction>
        });
        return `You've reached the AI usage limit for free users (${aiUsageCount}/${AI_USAGE_LIMIT_FREE}).`;
    }

    setIsAiProcessing(true);
    try {
        if(!isPro) setAiUsageCount(prev => prev + 1);
        const input: EditWebsiteInput = { prompt, currentPages: getEditorContentForSave(), globalSettings: globalSettings, activePageSlug: currentPages[activePageIndex]?.slug || '/', };
        const result = await editWebsite(input);
        const newPagesFromAI = result.modifiedPages || [];
        if (result.modifiedPages) {
            const sanitizedPages = newPagesFromAI.map(p => ({ ...p, _id: (p._id || newObjectId()).toString(), elements: (p.elements || []).map(el => ({ ...el, _id: (el._id || newObjectId()).toString(), })) })) as IWebsiteVersionPage[];
            updatePagesWithHistory(() => sanitizedPages, "AI Edit");
            setSelectedElement(null);
        }
        if (result.modifiedGlobalSettings) { handleGlobalSettingsChange('fontFamily', result.modifiedGlobalSettings.fontFamily); handleGlobalSettingsChange('fontHeadline', result.modifiedGlobalSettings.fontHeadline); handleGlobalSettingsChange('siteName', result.modifiedGlobalSettings.siteName); }
        const usageMessage = !isPro ? ` (${aiUsageCount + 1}/${AI_USAGE_LIMIT_FREE} uses left)` : '';
        toast({ title: "AI Assistant", description: `${result.explanation}${usageMessage}` });
        logAiInteraction({ websiteId, prompt, response: result.explanation, status: 'success' });
        return result.explanation;
    } catch (error: any) {
        console.error("AI editing error:", error);
        toast({ title: "AI Error", description: error.message, variant: "destructive" });
        logAiInteraction({ websiteId, prompt, response: "An error occurred.", status: 'error', errorDetails: error.message });
        return "An error occurred while I was trying to make changes.";
    } finally { setIsAiProcessing(false); }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  
  if (isLoadingWebsite) return ( <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center"> <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading editor...</p> </div> );
  if (!websiteId && !isLoadingWebsite) return ( <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center p-8"> <Card className="max-w-md text-center"><CardHeader><CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2" />Error: Website Not Specified</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">No website ID was provided. Select a website from your dashboard.</p><Button asChild className="mt-6"><a href="/dashboard">Go to Dashboard</a></Button></CardContent></Card></div> );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(event) => setActiveDraggedItem(event.active)} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} websiteId={websiteId} editorSaveStatus={editorSaveStatus} onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)} onOpenTemplateGalleryModal={() => setIsTemplateGalleryModalOpen(true)} onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} />
        <div className="flex flex-1 overflow-hidden">
          <ComponentLibrarySidebar />
          <main className="flex-1 flex flex-col p-1 md:p-2 lg:p-4 overflow-hidden bg-muted/30">
            <EditorToolbar
                websiteId={websiteId}
                activePageIndex={activePageIndex}
                setActivePageIndex={(i) => { setActivePageIndex(i); setSelectedElement(null); }}
                currentPages={currentPages}
                handleAddNewPage={handleAddNewPage}
                setPageToClearIndex={setPageToClearIndex}
                setShowClearPageConfirm={setShowClearPageConfirm}
                setPageToDeleteIndex={setPageToDeleteIndex}
                setShowPageDeleteConfirm={setShowPageDeleteConfirm}
                editorSaveStatus={editorSaveStatus}
                handleEditorSaveChanges={handleEditorSaveChanges}
            />
            <CanvasEditor devicePreview={currentDevice} page={currentPages[activePageIndex]} pageIndex={activePageIndex} onElementSelect={handleElementSelect} isDragging={!!activeDraggedItem} activeDragId={activeDraggedItem?.id as string | null} selectedElementId={selectedElement?._id as string | null} allNavigations={allSiteNavigations}/>
          </main>
          <PropertiesPanel
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            handlePropertyChange={handlePropertyChange}
            handlePageDetailsChange={handlePageDetailsChange}
            handleGlobalSettingsChange={handleGlobalSettingsChange}
            deleteSelectedElement={deleteSelectedElement}
            duplicateSelectedElement={duplicateSelectedElement}
            resetSelectedElementStyles={resetSelectedElementStyles}
            activePageData={currentPages[activePageIndex]}
            globalSettings={globalSettings}
            allSiteNavigations={allSiteNavigations}
            websiteId={websiteId}
            isNavigationsLoading={editorState.isNavigationsLoading}
            createNavigation={async (name) => {
              if (!websiteId) return;
              setIsAiProcessing(true);
              try { const res = await editorState.createNavigation(name); if (res.success) { if (websiteId) await fetchSiteNavigations(websiteId); } else toast({title: "Error", description: res.error}); } catch (e) { toast({title: "Error", description: (e as Error).message}); }
              finally { setIsAiProcessing(false); }
            }}
            updateNavigation={async (navId, name, items) => {
              if (!websiteId) return;
              setIsAiProcessing(true);
              try { const res = await editorState.updateNavigation(navId, name, items); if (res.success) { if (websiteId) await fetchSiteNavigations(websiteId); } else toast({title: "Error", description: res.error}); } catch (e) { toast({title: "Error", description: (e as Error).message}); }
              finally { setIsAiProcessing(false); }
            }}
            deleteNavigation={async (navId) => {
              if (!websiteId) return;
              setIsAiProcessing(true);
              try { const res = await editorState.deleteNavigation(navId); if (res.success) { if (websiteId) await fetchSiteNavigations(websiteId); } else toast({title: "Error", description: res.error}); } catch (e) { toast({title: "Error", description: (e as Error).message}); }
              finally { setIsAiProcessing(false); }
            }}
          />
        </div>
        <AiChatAssistant onPromptSubmit={handleAiPromptSubmit} isProcessing={isAiProcessing} />
        {websiteId && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen} currentDesignData={getEditorContentForSave()} />}
        <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} onApplyTemplate={handleApplyTemplate} />
        
        <AlertDialog open={showPageDeleteConfirm} onOpenChange={setShowPageDeleteConfirm}>
            <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Are you sure?</AlertDialogTitle> <AlertDialogDescription>This will delete the page "{pageToDeleteIndex !== null ? currentPages[pageToDeleteIndex]?.name : ''}".</AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => setShowPageDeleteConfirm(false)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDeletePage} className="bg-destructive hover:bg-destructive/90">Delete Page</AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showClearPageConfirm} onOpenChange={(isOpen) => { if (!isOpen) setPageToClearIndex(null); setShowClearPageConfirm(isOpen); }}>
          <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Are you sure?</AlertDialogTitle> <AlertDialogDescription>This will permanently remove all components from "{pageToClearIndex !== null ? currentPages[pageToClearIndex]?.name : ''}".</AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => { setShowClearPageConfirm(false); setPageToClearIndex(null); }}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleClearPage} className="bg-destructive hover:bg-destructive/90">Clear Page</AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
}
