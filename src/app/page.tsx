"use client";

import { useState } from 'react';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';

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
        {/* Optional: Properties Panel Sidebar could be added here */}
        {/* <aside className="w-72 bg-card border-l border-border p-4 shadow-sm">Properties Panel</aside> */}
      </div>
    </div>
  );
}
