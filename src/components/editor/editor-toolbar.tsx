// src/components/editor/editor-toolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FilePlus, X, Eraser, Loader2, CheckCircle, AlertCircle as AlertCircleIcon } from "lucide-react";
import type { EditorSaveStatus } from "@/hooks/useEditor";
import type { IWebsiteVersionPage } from "@/models/WebsiteVersion";

interface EditorToolbarProps {
  websiteId: string | null;
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
  currentPages: IWebsiteVersionPage[];
  handleAddNewPage: () => void;
  setPageToClearIndex: (index: number | null) => void;
  setShowClearPageConfirm: (show: boolean) => void;
  setPageToDeleteIndex: (index: number | null) => void;
  setShowPageDeleteConfirm: (show: boolean) => void;
  editorSaveStatus: EditorSaveStatus;
  handleEditorSaveChanges: () => void;
}

export function EditorToolbar({
  websiteId,
  activePageIndex,
  setActivePageIndex,
  currentPages,
  handleAddNewPage,
  setPageToClearIndex,
  setShowClearPageConfirm,
  setPageToDeleteIndex,
  setShowPageDeleteConfirm,
  editorSaveStatus,
  handleEditorSaveChanges,
}: EditorToolbarProps) {

  const renderEditorSaveStatus = () => {
    if (!websiteId) return null;
    let Icon = CheckCircle;
    let text = "Up to date";
    let color = "text-muted-foreground";
    switch (editorSaveStatus) {
      case 'saving': Icon = Loader2; text = "Saving..."; color = "text-muted-foreground animate-spin"; break;
      case 'saved': Icon = CheckCircle; text = "Saved"; color = "text-green-600"; break;
      case 'error': Icon = AlertCircleIcon; text = "Error Saving"; color = "text-destructive"; break;
      case 'unsaved_changes': Icon = AlertCircleIcon; text = "Unsaved Changes"; color = "text-amber-600"; break;
    }
    return (
      <div className={`flex items-center text-xs ${color} mr-2`}>
        <Icon className={`h-4 w-4 mr-1 ${editorSaveStatus === 'saving' ? 'animate-spin' : ''}`} />
        {text}
      </div>
    );
  };

  return (
    <div className="flex justify-between items-center p-2 border-b bg-card mb-2 gap-3">
      <div className="overflow-x-auto">
        <Tabs value={activePageIndex.toString()} onValueChange={(value) => setActivePageIndex(parseInt(value))} className="max-w-full">
          <TabsList className="bg-transparent p-0 h-auto">
            {currentPages.map((page, index) => (
              <TabsTrigger key={page._id as string || index} value={index.toString()} className="text-xs px-2 py-1.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary">
                {page.name}
                <div className="flex items-center ml-1">
                  {page.elements.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPageToClearIndex(index); setShowClearPageConfirm(true); }} className="p-0.5 rounded hover:bg-destructive/20" aria-label={`Clear page ${page.name}`} title={`Clear page ${page.name}`}>
                      <Eraser className="h-3 w-3 text-destructive/70 hover:text-destructive" />
                    </button>
                  )}
                  {currentPages.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPageToDeleteIndex(index); setShowPageDeleteConfirm(true); }} className="p-0.5 rounded hover:bg-destructive/20" aria-label={`Delete page ${page.name}`} title={`Delete page ${page.name}`}>
                      <X className="h-3 w-3 text-destructive/70 hover:text-destructive" />
                    </button>
                  )}
                </div>
              </TabsTrigger>
            ))}
            <Button variant="ghost" size="sm" onClick={handleAddNewPage} className="text-xs h-auto px-2 py-1.5 ml-1">
              <FilePlus className="mr-1 h-3.5 w-3.5" />Add Page
            </Button>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex items-center flex-shrink-0">
        {renderEditorSaveStatus()}
        <Button size="sm" onClick={handleEditorSaveChanges} disabled={editorSaveStatus === 'saving' || editorSaveStatus === 'saved' || editorSaveStatus === 'idle'}>
          <Save className="mr-2 h-4 w-4" />Save Site
        </Button>
      </div>
    </div>
  );
}
