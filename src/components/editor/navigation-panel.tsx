// src/components/editor/navigation-panel.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, Trash2, Edit, Save, ArrowLeft, Navigation as NavigationIcon } from 'lucide-react';
import type { INavigation, INavigationItem } from '@/models/Navigation';

interface NavigationPanelProps {
  websiteId: string | null;
  allSiteNavigations: INavigation[];
  isNavigationsLoading: boolean;
  handleCreateNavigation: (name: string) => Promise<any>;
  handleUpdateNavigation: (navId: string, name: string, items: INavigationItem[]) => Promise<any>;
  handleDeleteNavigation: (navId: string) => Promise<any>;
}

export function NavigationPanel({
  websiteId,
  allSiteNavigations,
  isNavigationsLoading,
  handleCreateNavigation,
  handleUpdateNavigation,
  handleDeleteNavigation
}: NavigationPanelProps) {
  const [newNavigationName, setNewNavigationName] = useState("");
  const [navigationToDelete, setNavigationToDelete] = useState<INavigation | null>(null);
  const [selectedNav, setSelectedNav] = useState<INavigation | null>(null);
  const [editingNavName, setEditingNavName] = useState("");
  const [editingNavItems, setEditingNavItems] = useState<INavigationItem[]>([]);

  const onEditClick = (nav: INavigation) => {
    setSelectedNav(nav);
    setEditingNavName(nav.name);
    setEditingNavItems(JSON.parse(JSON.stringify(nav.items)));
  };

  const onSaveClick = async () => {
    if (!selectedNav) return;
    await handleUpdateNavigation(selectedNav._id as string, editingNavName, editingNavItems);
    setSelectedNav(null);
  };
  
  const handleItemChange = (index: number, field: keyof INavigationItem, value: string) => {
    setEditingNavItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
    });
  };

  const handleAddItem = () => setEditingNavItems(prev => [...prev, { label: "New Link", url: "#", type: "internal" }]);
  const handleDeleteItem = (index: number) => setEditingNavItems(prev => prev.filter((_, i) => i !== index));

  if (selectedNav) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center"><NavigationIcon className="mr-2 h-4 w-4" />Edit Navigation</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNav(null)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label htmlFor="editingNavName" className="text-xs">Navigation Name</Label><Input id="editingNavName" value={editingNavName} onChange={(e) => setEditingNavName(e.target.value)} className="text-xs bg-input" /></div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {editingNavItems.map((item, index) => (
              <div key={index} className="p-2 border rounded bg-background shadow-sm space-y-1">
                <div className="flex items-center justify-between"><p className="text-xxs text-muted-foreground">Link Item #{index + 1}</p><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(index)}><Trash2 className="h-3 w-3 text-destructive"/></Button></div>
                <div><Label htmlFor={`edit-nav-text-${index}`} className="text-xxs">Label</Label><Input id={`edit-nav-text-${index}`} value={item.label} onChange={(e) => handleItemChange(index, 'label', e.target.value)} className="text-xs h-8 bg-input" /></div>
                <div><Label htmlFor={`edit-nav-url-${index}`} className="text-xxs">URL</Label><Input id={`edit-nav-url-${index}`} value={item.url} onChange={(e) => handleItemChange(index, 'url', e.target.value)} className="text-xs h-8 bg-input" /></div>
                <div><Label htmlFor={`edit-nav-type-${index}`} className="text-xxs">Type</Label><Select value={item.type || 'internal'} onValueChange={(val) => handleItemChange(index, 'type', val)}><SelectTrigger className="text-xs h-8 bg-input"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="internal">Internal</SelectItem><SelectItem value="external">External</SelectItem></SelectContent></Select></div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={handleAddItem} className="w-full mt-2 text-xs"><PlusCircle className="mr-1.5 h-3.5 w-3.5"/>Add Link Item</Button>
          <Button size="sm" onClick={onSaveClick} disabled={isNavigationsLoading} className="w-full mt-2">{isNavigationsLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4 mr-2" />}Save Changes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold flex items-center"><NavigationIcon className="mr-2 h-4 w-4" />Manage Site Navigations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newNavigationName" className="text-xs">Create New Navigation</Label>
            <div className="flex gap-2 mt-1">
              <Input id="newNavigationName" value={newNavigationName} onChange={(e) => setNewNavigationName(e.target.value)} placeholder="e.g., Main Menu" className="text-xs bg-input" disabled={!websiteId || isNavigationsLoading} />
              <Button size="sm" onClick={() => handleCreateNavigation(newNavigationName).then(() => setNewNavigationName(""))} disabled={!websiteId || isNavigationsLoading || !newNavigationName.trim()}>
                {isNavigationsLoading && newNavigationName ? <Loader2 className="animate-spin h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {isNavigationsLoading && !allSiteNavigations.length ? <div className="text-xs text-muted-foreground py-2">Loading...</div> : allSiteNavigations.length === 0 ? <p className="text-xs text-muted-foreground py-2">No navigations created yet.</p> : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allSiteNavigations.map(nav => (
                <div key={nav._id as string} className="flex items-center justify-between p-2 border rounded-md bg-input/30">
                  <span className="text-xs font-medium truncate" title={nav.name}>{nav.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditClick(nav)}><Edit className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNavigationToDelete(nav)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!navigationToDelete} onOpenChange={(isOpen) => !isOpen && setNavigationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Navigation?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{navigationToDelete?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNavigationToDelete(null)} disabled={isNavigationsLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteNavigation(navigationToDelete?._id as string)} className="bg-destructive hover:bg-destructive/90" disabled={isNavigationsLoading}>{isNavigationsLoading ? <Loader2 className="animate-spin h-4 w-4"/> : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
