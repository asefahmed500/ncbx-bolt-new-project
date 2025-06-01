
"use client";

import { useState } from 'react';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Note: Device toggle buttons are part of AppHeader and conditionally rendered based on props.

export default function EditorPage() {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} />
      <div className="flex flex-1 overflow-hidden">
        <ComponentLibrarySidebar />
        <main className="flex-1 flex flex-col p-1 md:p-4 overflow-hidden bg-muted/30">
          <CanvasEditor devicePreview={currentDevice} />
        </main>
        <aside className="w-72 bg-card border-l border-border p-4 shadow-sm flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select a component on the canvas to edit its properties.</p>
              {/* Placeholder for properties form */}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
