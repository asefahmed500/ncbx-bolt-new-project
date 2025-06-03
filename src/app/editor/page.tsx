
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor, type CanvasElementPlaceholder } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Type, Image as ImageIcon, Square as ButtonIconElement, BarChart2, UploadCloud, Crop, Sparkles, Box, Columns as ColumnsIcon, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWebsiteEditorData, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import type { IWebsite, IWebsiteVersion, IWebsiteVersionPage, IPageComponent } from '@/models/Website';
import type { ITemplate } from '@/models/Template';
import { useToast } from '@/hooks/use-toast';
import { SaveTemplateModal } from '@/components/editor/save-template-modal';
import { TemplateGalleryModal } from '@/components/editor/template-gallery-modal';

// Represents the data structure for an element selected in the editor
interface SelectedElementData extends IPageComponent {
  pageIndex: number; // To know which page it belongs to
}

const defaultInitialPage: IWebsiteVersionPage = {
  _id: Date.now().toString(), // Temporary client-side ID
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
  const [websiteData, setWebsiteData] = useState<IWebsite | null>(null); // Only IWebsite initially
  
  // State for the actual content being edited
  const [currentPages, setCurrentPages] = useState<IWebsiteVersionPage[]>([defaultInitialPage]);
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(true);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);

  // Save status for changes within the editor page itself
  const [editorSaveStatus, setEditorSaveStatus] = useState<EditorSaveStatus>('idle');


  const loadWebsiteData = useCallback(async (id: string) => {
    setIsLoadingWebsite(true);
    setEditorSaveStatus('idle');
    try {
      const result = await getWebsiteEditorData(id);
      if (result.error) {
        toast({ title: "Error Loading Website", description: result.error, variant: "destructive" });
        setWebsiteData(null);
        setCurrentPages([defaultInitialPage]);
      } else if (result.website) {
        setWebsiteData(result.website);
        if (result.currentVersion && result.currentVersion.pages && result.currentVersion.pages.length > 0) {
          setCurrentPages(result.currentVersion.pages.map(p => ({...p, _id: p._id || new mongoose.Types.ObjectId().toString() } as IWebsiteVersionPage)));
        } else {
          // If no current version or pages, start with a default blank page.
          // Ensure websiteId is associated with this default state for saving.
          setCurrentPages([{ ...defaultInitialPage, _id: new mongoose.Types.ObjectId().toString() }]);
        }
        setEditorSaveStatus('saved'); // Initially, content matches DB
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
      setIsLoadingWebsite(false); // No ID, nothing to load
    }
  }, [websiteIdFromQuery, loadWebsiteData]);

  const handleElementSelect = useCallback((elementId: string, pageIndex: number) => {
    const page = currentPages[pageIndex];
    if (page) {
      const element = page.elements.find(el => (el._id as unknown as string) === elementId);
      if (element) {
        setSelectedElement({ ...element, pageIndex });
      } else {
        setSelectedElement(null);
      }
    }
  }, [currentPages]);

  const handleContentChange = () => {
    // This function would be called by the property inspector or canvas interactions
    // to update `currentPages` state. For now, just sets status.
    setEditorSaveStatus('unsaved_changes');
  };
  
  // Called by AppHeader's save mechanism
  const getEditorContentForSave = useCallback((): SaveWebsiteContentInput['pages'] => {
    return currentPages.map(page => ({
        name: page.name,
        slug: page.slug,
        elements: page.elements.map(el => ({ type: el.type, config: el.config, order: el.order })), // Strip _id for saving if they are client-generated for new elements
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
    }));
  }, [currentPages]);

  const handleApplyTemplate = useCallback((template: ITemplate) => {
    if (template.pages && template.pages.length > 0) {
      // Ensure new elements get client-side IDs if needed, or handle this on backend
      const newPagesWithIds = template.pages.map(p => ({
        ...p,
        _id: new mongoose.Types.ObjectId().toString(), // Give page a new ID
        elements: p.elements.map(el => ({ ...el, _id: new mongoose.Types.ObjectId().toString() })) // Give elements new IDs
      })) as IWebsiteVersionPage[];
      setCurrentPages(newPagesWithIds);
      setSelectedElement(null); // Deselect any current element
      setEditorSaveStatus('unsaved_changes'); // Mark as unsaved
      toast({ title: "Template Applied", description: `"${template.name}" has been applied. Save your changes to persist.` });
    } else {
      toast({ title: "Empty Template", description: "Selected template has no content.", variant: "destructive" });
    }
    setIsTemplateGalleryModalOpen(false);
  }, [toast]);
  
  // Function to be called by the editor's own Save button
  const handleEditorSaveChanges = async () => {
    if (!websiteId) {
      toast({ title: "Error", description: "No website ID available to save changes.", variant: "destructive" });
      return;
    }
    setEditorSaveStatus('saving');
    const contentToSave: SaveWebsiteContentInput = {
      websiteId: websiteId,
      pages: getEditorContentForSave(),
      // globalSettings: websiteData?.currentVersion?.globalSettings || {}, // TODO: Manage global settings
    };

    try {
      const result = await saveWebsiteContent(contentToSave);
      if (result.success && result.website) {
        setEditorSaveStatus('saved');
        setWebsiteData(result.website); // Update website data (might have new currentVersionId)
        if (result.versionId && result.website.currentVersionId?.toString() === result.versionId) {
             // If save was successful, we might need to reload the pages from the new version
             // to get any backend-generated IDs or transformations.
             // For simplicity now, we assume client state is source of truth after save until next full load.
             // Or, we could update currentPages with the result if the action returned it.
            const savedVersion = await getWebsiteEditorData(websiteId);
            if(savedVersion.currentVersion?.pages) {
                 setCurrentPages(savedVersion.currentVersion.pages.map(p => ({...p, _id: p._id || new mongoose.Types.ObjectId().toString() } as IWebsiteVersionPage)));
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


  const renderPropertyFields = () => {
    if (!selectedElement) return null;

    // Example of how one might update: (VERY CONCEPTUAL, NOT FULLY WIRED)
    const handlePropertyChange = (propertyName: keyof IPageComponent['config'], value: any) => {
      setCurrentPages(prevPages => {
        const newPages = [...prevPages];
        const pageToUpdate = newPages[selectedElement.pageIndex];
        if (pageToUpdate) {
          const elementToUpdate = pageToUpdate.elements.find(el => (el._id as unknown as string) === (selectedElement._id as unknown as string));
          if (elementToUpdate) {
            elementToUpdate.config = { ...elementToUpdate.config, [propertyName]: value };
            // Update the selectedElement state as well to reflect change immediately in inspector
            setSelectedElement(prevSel => prevSel ? {...prevSel, config: elementToUpdate.config} : null);
            handleContentChange(); // Mark as unsaved
          }
        }
        return newPages;
      });
    };

    switch (selectedElement.type) {
      case 'heading': // Ensure type matches registry and PageComponentSchema
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.config?.text || selectedElement.config?.content || 'Heading'}</strong> (ID: {(selectedElement._id as unknown as string).slice(-6)})</p>
            <div className="space-y-2">
              <Label htmlFor="textContent" className="text-xs">Text Content</Label>
              <Textarea 
                id="textContent" 
                defaultValue={selectedElement.config?.text || selectedElement.config?.content || ""} 
                placeholder="Enter heading text" 
                className="text-xs" 
                onChange={(e) => handlePropertyChange('text', e.target.value)} 
              />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="fontSize" className="text-xs">Font Size (e.g., 2rem, 24px)</Label>
              <Input 
                type="text" 
                id="fontSize" 
                defaultValue={selectedElement.config?.fontSize || ""} 
                placeholder="e.g., 2rem" className="text-xs" 
                onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
              />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="color" className="text-xs">Text Color</Label>
              <Input 
                type="color" 
                id="color" 
                defaultValue={selectedElement.config?.color || "#333333"} 
                className="text-xs h-8 w-full" 
                onChange={(e) => handlePropertyChange('color', e.target.value)}
              />
            </div>
             <div className="space-y-2 mt-2">
              <Label htmlFor="headingLevel" className="text-xs">Level (H1-H6)</Label>
              <Select 
                defaultValue={selectedElement.config?.level || "h2"}
                onValueChange={(value) => handlePropertyChange('level', value)}
              >
                <SelectTrigger id="headingLevel" className="w-full text-xs bg-input">
                    <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                    <SelectItem value="h4">H4</SelectItem>
                    <SelectItem value="h5">H5</SelectItem>
                    <SelectItem value="h6">H6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      // ... other cases from original file ...
      case 'image':
         return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.config?.alt || 'Image'}</strong> (ID: {(selectedElement._id as unknown as string).slice(-6)})</p>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs">Image Source URL</Label>
              <Input type="url" id="imageUrl" defaultValue={selectedElement.config?.src || ""} placeholder="https://placehold.co/600x400.png" className="text-xs" onChange={(e) => handlePropertyChange('src', e.target.value)} />
            </div>
             {/* Image preview if src exists */}
            {selectedElement.config?.src && (
                <div className="mt-2">
                    <img src={selectedElement.config.src as string} alt={selectedElement.config?.alt as string || 'Preview'} className="rounded-md max-w-full h-auto border" data-ai-hint="placeholder image"/>
                </div>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" disabled>
              <UploadCloud className="mr-2 h-3.5 w-3.5" /> Upload Image (Conceptual)
            </Button>
            <div className="space-y-2 mt-2">
              <Label htmlFor="altText" className="text-xs">Alt Text (Accessibility)</Label>
              <Input type="text" id="altText" defaultValue={selectedElement.config?.alt || ""} placeholder="Descriptive text for image" className="text-xs" onChange={(e) => handlePropertyChange('alt', e.target.value)}/>
            </div>
          </>
        );
      default:
        return (
          <>
            <p className="text-sm text-muted-foreground mb-2">Editing properties for: <strong>{selectedElement.type} (ID: {(selectedElement._id as unknown as string).slice(-6)})</strong></p>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">{JSON.stringify(selectedElement.config, null, 2)}</pre>
            <p className="text-xs text-muted-foreground mt-3">No specific UI for this element type yet. Add onChange handlers to inputs to enable editing.</p>
          </>
        );
    }
  };

  if (isLoadingWebsite) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (!websiteId && !isLoadingWebsite) {
     return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center p-8">
        <Card className="max-w-md text-center">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2"/>Error: Website Not Specified</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    No website ID was provided in the URL. Please select a website from your dashboard to edit.
                </p>
                <Button asChild className="mt-6">
                    <a href="/dashboard">Go to Dashboard</a>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  const renderEditorSaveStatus = () => {
    if (!websiteId) return null;
    switch (editorSaveStatus) {
      case 'saving':
        return <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving...</div>;
      case 'saved':
        return <div className="flex items-center text-xs text-green-600"><CheckCircle className="h-4 w-4 mr-1" />Saved</div>;
      case 'error':
        return <div className="flex items-center text-xs text-destructive"><AlertCircle className="h-4 w-4 mr-1" />Error Saving</div>;
      case 'unsaved_changes':
        return <div className="flex items-center text-xs text-amber-600"><AlertCircle className="h-4 w-4 mr-1" />Unsaved Changes</div>;
      default: // idle (usually after load, before changes)
        return <div className="flex items-center text-xs text-muted-foreground"><CheckCircle className="h-4 w-4 mr-1" />Up to date</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader
        currentDevice={currentDevice}
        onDeviceChange={setCurrentDevice}
        websiteId={websiteId}
        getEditorContentForSave={getEditorContentForSave}
        editorSaveStatus={editorSaveStatus} // Pass editor's save status to AppHeader
        onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)}
        onOpenTemplateGalleryModal={() => setIsTemplateGalleryModalOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <ComponentLibrarySidebar />
        <main className="flex-1 flex flex-col p-1 md:p-4 overflow-hidden bg-muted/30">
          {/* Editor-specific Save Button and Status */}
           <div className="flex justify-end items-center p-2 border-b bg-card mb-2 gap-3">
              {renderEditorSaveStatus()}
              <Button 
                size="sm" 
                onClick={handleEditorSaveChanges} 
                disabled={editorSaveStatus === 'saving' || editorSaveStatus === 'saved' || editorSaveStatus === 'idle'}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Site Changes
              </Button>
          </div>
          <CanvasEditor 
            devicePreview={currentDevice} 
            pages={currentPages}
            onElementSelect={handleElementSelect}
            onDropComponent={(componentType, pageIndex, targetOrder) => {
                // Placeholder for adding new component from sidebar
                setCurrentPages(prevPages => {
                    const newPages = [...prevPages];
                    const pageToUpdate = newPages[pageIndex];
                    if (pageToUpdate) {
                        const newElement: IPageComponent = {
                            _id: new mongoose.Types.ObjectId().toString(), // Client-side ID for new element
                            type: componentType,
                            config: { text: `New ${componentType}` }, // Default config
                            order: targetOrder !== undefined ? targetOrder : pageToUpdate.elements.length,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        // Simple add to end or at specific order. Real reordering is more complex.
                        if (targetOrder !== undefined) {
                             pageToUpdate.elements.splice(targetOrder, 0, newElement);
                             // Re-assign order for subsequent elements
                             for(let i = targetOrder + 1; i < pageToUpdate.elements.length; i++) {
                                pageToUpdate.elements[i].order = i;
                             }
                        } else {
                            pageToUpdate.elements.push(newElement);
                        }

                    }
                    return newPages;
                });
                setEditorSaveStatus('unsaved_changes');
                toast({ title: "Component Added", description: `${componentType} added to page ${pageIndex + 1}. Remember to save.` });
            }}
          />
        </main>
        <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center">
                {selectedElement ? (
                  <>
                    <MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />
                    {selectedElement.type} Properties
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    Page Settings
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedElement ? (
                <div className="space-y-4">
                  {renderPropertyFields()}
                  <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)}>Deselect Element</Button>
                </div>
              ) : (
                <>
                <p className="text-sm text-muted-foreground">
                  Select an element on the canvas to edit its properties.
                  Current Website ID: {websiteId || "N/A"}
                  <br/>
                  Active Page: {currentPages[0]?.name || "Home (Default)"} (Page: 1/{currentPages.length})
                </p>
                {/* Page settings UI */}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
      {websiteId && <SaveTemplateModal 
        isOpen={isSaveTemplateModalOpen} 
        onOpenChange={setIsSaveTemplateModalOpen} 
        currentDesignData={currentPages}
      />}
      <TemplateGalleryModal 
        isOpen={isTemplateGalleryModalOpen} 
        onOpenChange={setIsTemplateGalleryModalOpen} 
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading editor dependencies...</p>
      </div>
    }>
      <EditorPageComponent />
    </Suspense>
  );
}
