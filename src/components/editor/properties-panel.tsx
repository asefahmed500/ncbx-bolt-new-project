// src/components/editor/properties-panel.tsx
"use client";

import { useRef, useState } from 'react';
import type { SelectedElementData } from '@/hooks/useEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Loader2, Save, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon, FilePlus, Trash2, PlusCircle, Navigation as NavigationIcon, Link as LinkIcon, Copy, X, Edit, UploadCloud, ArrowLeft, RotateCcw, Eraser } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getComponentConfig } from '@/components/editor/componentRegistry';
import { NavigationPanel } from './navigation-panel';
import { getCloudinarySignature } from '@/actions/assets';
import { useToast } from '@/hooks/use-toast';
import type { IWebsiteVersion, IWebsiteVersionPage, IPageComponent } from '@/models/WebsiteVersion';
import type { INavigation, INavigationItem } from '@/models/Navigation';

interface PropertiesPanelProps {
  selectedElement: SelectedElementData | null;
  setSelectedElement: (element: SelectedElementData | null) => void;
  handlePropertyChange: (path: string, value: any) => void;
  handlePageDetailsChange: (pageId: string, name: string, slug: string, seoTitle?: string, seoDescription?: string) => void;
  handleGlobalSettingsChange: (key: string, value: any) => void;
  deleteSelectedElement: () => void;
  duplicateSelectedElement: () => void;
  resetSelectedElementStyles: () => void;
  activePageData: IWebsiteVersionPage | null;
  globalSettings: IWebsiteVersion['globalSettings'];
  allSiteNavigations: INavigation[];
  websiteId: string | null;
  isNavigationsLoading: boolean;
  createNavigation: (name: string) => Promise<any>;
  updateNavigation: (navId: string, name: string, items: INavigationItem[]) => Promise<any>;
  deleteNavigation: (navId: string) => Promise<any>;
}

export function PropertiesPanel({
  selectedElement,
  setSelectedElement,
  handlePropertyChange,
  handlePageDetailsChange,
  handleGlobalSettingsChange,
  deleteSelectedElement,
  duplicateSelectedElement,
  resetSelectedElementStyles,
  activePageData,
  globalSettings,
  allSiteNavigations,
  websiteId,
  isNavigationsLoading,
  createNavigation,
  updateNavigation,
  deleteNavigation,
}: PropertiesPanelProps) {

  const { toast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetKey, setUploadTargetKey] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetKey) return;

    setIsUploading(true);
    toast({ title: 'Uploading image...', description: 'Please wait.' });
    try {
        const signatureResult = await getCloudinarySignature({ folder: 'ncbx_user_assets' });
        if (signatureResult.error || !signatureResult.signature) throw new Error(signatureResult.error || 'Failed to get upload signature.');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureResult.apiKey!);
        formData.append('timestamp', signatureResult.timestamp!.toString());
        formData.append('signature', signatureResult.signature);
        formData.append('folder', 'ncbx_user_assets');
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signatureResult.cloudName!}/image/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.secure_url) { handlePropertyChange(uploadTargetKey, data.secure_url); toast({ title: 'Upload Successful!', description: 'Image has been updated.' }); } 
        else { throw new Error(data.error?.message || 'Cloudinary upload failed.'); }
    } catch (error: any) { toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' }); }
    finally {
        setIsUploading(false);
        setUploadTargetKey(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderGlobalStyleFields = () => (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold">Global Styles</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><Label htmlFor="siteName" className="text-xs">Site Name</Label><Input id="siteName" value={globalSettings?.siteName || ''} onChange={(e) => handleGlobalSettingsChange('siteName', e.target.value)} className="text-xs bg-input"/></div>
        <div><Label htmlFor="fontFamily" className="text-xs">Body Font</Label><Input id="fontFamily" placeholder="e.g. Inter" value={globalSettings?.fontFamily || ''} onChange={(e) => handleGlobalSettingsChange('fontFamily', e.target.value)} className="text-xs bg-input"/></div>
        <div><Label htmlFor="fontHeadline" className="text-xs">Headline Font</Label><Input id="fontHeadline" placeholder="e.g. Poppins" value={globalSettings?.fontHeadline || ''} onChange={(e) => handleGlobalSettingsChange('fontHeadline', e.target.value)} className="text-xs bg-input"/></div>
      </CardContent>
    </Card>
  );

  const renderPropertyFields = () => {
    const renderFieldsRecursive = (configObject: any, pathPrefix = '') => { return Object.entries(configObject).map(([key, value]) => { if (key === 'id' || key === 'elements' || key === 'columns' || key.toLowerCase().includes('dataaihint')) return null; const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key; if (Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) { return renderFieldsForArray(value, currentPath, key); } if (typeof value === 'object' && value !== null && !Array.isArray(value)) { return ( <div key={currentPath} className="p-3 border rounded-md space-y-3 bg-muted/50 mt-2"> <p className="text-sm font-semibold capitalize text-muted-foreground">{key}</p> <div className="pl-2 border-l-2 border-border space-y-3">{renderFieldsRecursive(value, currentPath)}</div> </div> ); } return <RenderPropertyField key={currentPath} propKey={key} propValue={value} path={currentPath} />; }); };
    const renderFieldsForArray = (arr: any[], path: string, label: string) => { const handleAddItem = () => { const newItem = arr.length > 0 ? JSON.parse(JSON.stringify(arr[0])) : {}; Object.keys(newItem).forEach(key => { if (typeof newItem[key] === 'string') newItem[key] = `New ${key}`; if (typeof newItem[key] === 'number') newItem[key] = 0; if (typeof newItem[key] === 'boolean') newItem[key] = false; if (key.toLowerCase().includes('image')) newItem[key] = 'https://placehold.co/300x200.png'; }); handlePropertyChange(path, [...arr, newItem]); }; const handleRemoveItem = (index: number) => { const newArray = arr.filter((_, i) => i !== index); handlePropertyChange(path, newArray); }; return ( <div key={path} className="space-y-2"> <h4 className="text-sm font-semibold text-muted-foreground capitalize border-b pb-1 mb-2">{label.replace(/_/g, ' ')}</h4> {arr.map((item, index) => ( <div key={`${path}.${index}`} className="p-2 border rounded bg-card relative"> <div className="flex justify-between items-center mb-1"> <p className="text-xxs text-muted-foreground">Item {index + 1}</p> <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}> <Trash2 className="h-3.5 w-3.5 text-destructive" /> </Button> </div> <div className="pl-2 border-l-2 border-border space-y-3"> {renderFieldsRecursive(item, `${path}.${index}`)} </div> </div> ))} <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleAddItem}> <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Item </Button> </div> ); };
    const RenderPropertyField = ({ propKey, propValue, path }: { propKey: string; propValue: any; path: string }) => {
        const label = propKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (propKey === 'navigationId') { return ( <div key={path}> <Label htmlFor={path} className="text-xs">{label}</Label> <Select value={propValue || ''} onValueChange={(val) => handlePropertyChange(path, val)}> <SelectTrigger className="text-xs h-8 bg-input"><SelectValue placeholder="Select a navigation" /></SelectTrigger> <SelectContent> <SelectItem value="">None</SelectItem> {allSiteNavigations.map(nav => ( <SelectItem key={nav._id as string} value={nav._id as string}>{nav.name}</SelectItem> ))} </SelectContent> </Select> </div> ); }
        if (propKey.toLowerCase().includes('color')) { return ( <div key={path} className="flex items-center justify-between"> <Label htmlFor={path} className="text-xs">{label}</Label> <Input type="color" id={path} value={propValue || '#000000'} onChange={(e) => handlePropertyChange(path, e.target.value)} className="w-16 h-8 p-1 bg-input" /> </div> ); }
        if (propKey === 'src' || propKey.toLowerCase().includes('imageurl') || propKey.toLowerCase().includes('backgroundimage') || propKey.toLowerCase().includes('avatar')) { return ( <div key={path}> <Label htmlFor={path} className="text-xs">{label}</Label> <div className="flex gap-2"> <Input type="text" id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs h-8 bg-input" /> <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setUploadTargetKey(path); fileInputRef.current?.click(); }} disabled={isUploading}> {isUploading && uploadTargetKey === path ? <Loader2 className="animate-spin h-4 w-4" /> : <UploadCloud className="h-4 w-4"/>} </Button> </div> </div> ); }
        if (propKey === 'level') { return ( <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Select value={propValue || 'h2'} onValueChange={(val) => handlePropertyChange(path, val)}><SelectTrigger className="text-xs h-8 bg-input"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="h1">H1</SelectItem><SelectItem value="h2">H2</SelectItem><SelectItem value="h3">H3</SelectItem><SelectItem value="h4">H4</SelectItem><SelectItem value="h5">H5</SelectItem><SelectItem value="h6">H6</SelectItem></SelectContent></Select></div> ); }
        if (propKey === 'alignment' || propKey === 'textAlign') { return ( <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Select value={propValue || 'left'} onValueChange={(val) => handlePropertyChange(path, val)}><SelectTrigger className="text-xs h-8 bg-input capitalize"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select></div> ); }
        if (typeof propValue === 'string' && (propValue.length > 50 || propValue.includes('\n'))) { return ( <div key={path}> <Label htmlFor={path} className="text-xs">{label}</Label> <Textarea id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs bg-input" rows={5} /> </div> ); }
        if (typeof propValue === 'boolean') { return ( <div key={path} className="flex items-center justify-between rounded-md border p-2"><Label htmlFor={path} className="text-xs">{label}</Label><Switch id={path} checked={!!propValue} onCheckedChange={(checked) => handlePropertyChange(path, checked)} /></div> ); }
        if (typeof propValue === 'string' || typeof propValue === 'number') { return ( <div key={path}><Label htmlFor={path} className="text-xs">{label}</Label><Input type={typeof propValue === 'number' ? 'number' : 'text'} id={path} value={propValue || ''} onChange={(e) => handlePropertyChange(path, e.target.value)} className="text-xs h-8 bg-input" /></div> ); }
        return null;
    };
    if (selectedElement) {
        const componentMeta = getComponentConfig(selectedElement.type);
        return ( <div className="space-y-4"> <div className="flex justify-between items-center mb-3"> <p className="text-xs text-muted-foreground">Editing: <strong>{componentMeta?.label || selectedElement.type}</strong></p> <div className="flex items-center"> <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}> <AlertDialogTrigger asChild> <Button variant="ghost" size="sm" className="h-7 px-2" title="Reset Component Styles"> <RotateCcw className="h-3.5 w-3.5"/> </Button> </AlertDialogTrigger> <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Reset Component Styles?</AlertDialogTitle> <AlertDialogDescription> This will revert all properties of the "{componentMeta?.label}" component to their original defaults. This action cannot be undone, but you can choose not to save your changes. </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={() => { resetSelectedElementStyles(); setShowResetConfirm(false); }} className="bg-destructive hover:bg-destructive/90">Reset Styles</AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog> <Button variant="ghost" size="sm" className="h-7 px-2" onClick={duplicateSelectedElement} title="Duplicate Component"><Copy className="h-3.5 w-3.5"/></Button> <AlertDialog> <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2" title="Delete Component"><Trash2 className="h-3.5 w-3.5"/></Button></AlertDialogTrigger> <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the "{componentMeta?.label}" component from the canvas. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteSelectedElement} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent> </AlertDialog> </div> </div> {renderFieldsRecursive(selectedElement.config)} </div> );
    } else if (activePageData) {
        return (
          <Tabs defaultValue="page-settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
              <TabsTrigger value="page-settings" className="text-xs px-2 py-1.5 h-auto">Page</TabsTrigger>
              <TabsTrigger value="global-styles" className="text-xs px-2 py-1.5 h-auto">Global Styles</TabsTrigger>
              <TabsTrigger value="site-navigations" className="text-xs px-2 py-1.5 h-auto">Navigations</TabsTrigger>
            </TabsList>
            <TabsContent value="page-settings">
              <Card><CardHeader><CardTitle className="text-base font-semibold">Page: {activePageData.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label htmlFor="pageName" className="text-xs">Page Name</Label><Input type="text" id="pageName" value={activePageData.name || ""} placeholder="Home" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, e.target.value, activePageData.slug, activePageData.seoTitle, activePageData.seoDescription)} /></div>
                  <div><Label htmlFor="pageSlug" className="text-xs">Slug</Label><Input type="text" id="pageSlug" value={activePageData.slug || ""} placeholder="/home" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, e.target.value, activePageData.seoTitle, activePageData.seoDescription)} /></div>
                  <div><Label htmlFor="seoTitle" className="text-xs">SEO Title</Label><Input type="text" id="seoTitle" value={activePageData.seoTitle || ""} placeholder="Page Title for SEO" className="text-xs bg-input" onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, e.target.value, activePageData.seoDescription)} /></div>
                  <div><Label htmlFor="seoDescription" className="text-xs">SEO Description</Label><Textarea id="seoDescription" value={activePageData.seoDescription || ""} placeholder="Page description for SEO" className="text-xs bg-input" rows={3} onChange={(e) => handlePageDetailsChange(activePageData._id as string, activePageData.name, activePageData.slug, activePageData.seoTitle, e.target.value)} /></div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="global-styles">{renderGlobalStyleFields()}</TabsContent>
            <TabsContent value="site-navigations">
                <NavigationPanel websiteId={websiteId} allSiteNavigations={allSiteNavigations} isNavigationsLoading={isNavigationsLoading} handleCreateNavigation={createNavigation} handleUpdateNavigation={updateNavigation} handleDeleteNavigation={deleteNavigation} />
            </TabsContent>
          </Tabs>
        );
    }
    return <p className="text-sm text-muted-foreground p-4">Select an element or manage page settings.</p>;
  };
  
  return (
    <>
      <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center">
              {selectedElement ? <><MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />Properties</> : <><Settings className="w-5 h-5 mr-2 text-primary" />Page & Site Settings</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">{renderPropertyFields()}</div>
            {selectedElement && <Button variant="outline" size="sm" onClick={() => setSelectedElement(null)} className="mt-4">Deselect Element</Button>}
          </CardContent>
        </Card>
      </aside>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
    </>
  );
}
