
"use client";

import { useState } from 'react';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquare } from 'lucide-react';

export default function EditorPage() {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  // Placeholder: In a real app, this would come from your state management (e.g., Zustand, Redux, Context)
  // and be updated when an element on the canvas is clicked.
  const [selectedElement, setSelectedElement] = useState<null | { id: string; type: string }>(null);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} />
      <div className="flex flex-1 overflow-hidden">
        <ComponentLibrarySidebar />
        <main className="flex-1 flex flex-col p-1 md:p-4 overflow-hidden bg-muted/30">
          {/* Pass setSelectedElement to CanvasEditor if it handles selection logic */}
          <CanvasEditor devicePreview={currentDevice} />
        </main>
        <aside className="w-72 bg-card border-l border-border p-4 shadow-sm flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center">
                {selectedElement ? (
                  <>
                    <MousePointerSquare className="w-5 h-5 mr-2 text-primary" />
                    Element Properties
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
                <>
                  <p className="text-sm text-muted-foreground mb-2">Editing properties for: <strong>{selectedElement.type}</strong></p>
                  {/* Placeholder for actual properties form based on selectedElement.type */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="elemId" className="text-xs text-muted-foreground">Element ID</label>
                      <input type="text" id="elemId" value={selectedElement.id} readOnly className="mt-1 w-full p-1 border rounded-md text-xs bg-muted" />
                    </div>
                     <p className="text-xs text-muted-foreground">More properties specific to '{selectedElement.type}' would appear here.</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No element selected. Showing page-level settings. (e.g., Page Title, SEO, Background)
                </p>
              )}
              {/* Example: Click anywhere on the canvas (conceptually) to clear selection */}
              {selectedElement && (
                 <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelectedElement(null)}>
                    Clear Selection (Show Page Settings)
                  </Button>
              )}
               {!selectedElement && (
                 <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelectedElement({id: 'sample-123', type: 'Heading'})}>
                    Select Sample Element
                  </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
