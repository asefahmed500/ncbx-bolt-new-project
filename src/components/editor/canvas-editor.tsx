
"use client";

import { useState } from 'react'; // Added useState
import type { DeviceType } from './app-header';
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid } from 'lucide-react';

interface CanvasEditorProps {
  devicePreview: DeviceType;
}

export function CanvasEditor({ devicePreview }: CanvasEditorProps) {
  const { toast } = useToast();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('application/json')) {
      setIsDraggingOver(true);
      event.dataTransfer.dropEffect = "move";
    } else {
      event.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Check if the mouse is leaving the drop zone container itself, not just moving over a child element.
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDraggingOver(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
    if (event.dataTransfer.types.includes('application/json')) {
      event.dataTransfer.dropEffect = "move";
      if (!isDraggingOver) setIsDraggingOver(true); // Ensure state is true if drag started outside but moved in
    } else {
      event.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false); // Reset visual feedback
    const dataString = event.dataTransfer.getData('application/json');
    if (dataString) {
      try {
        const componentData = JSON.parse(dataString);
        console.log("Dropped component:", componentData);
        toast({
          title: "Component Dropped",
          description: `"${componentData.label}" component was added to the canvas (conceptually).`,
        });
      } catch (error) {
        console.error("Failed to parse dropped data:", error);
        toast({
          title: "Drop Error",
          description: "Could not read component data.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div 
      className="flex-1 bg-muted/50 p-6 rounded-lg shadow-inner flex justify-center items-start overflow-auto"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div 
        className="bg-background shadow-lg transition-all duration-200 ease-in-out mx-auto relative"
        style={{ 
          width: getCanvasWidth(), 
          height: devicePreview === 'desktop' ? 'calc(100% - 0rem)' : '812px', 
          minHeight: '400px',
          border: isDraggingOver 
            ? '2px solid hsl(var(--primary))' 
            : '2px dashed hsl(var(--border) / 0.5)',
          padding: '20px', 
          boxSizing: 'border-box',
          opacity: isDraggingOver ? 0.85 : 1, // Visual feedback for dragging over
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none">
          <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Canvas Editor</p>
          <p className="text-sm">Drag components here to build your website.</p>
          <p className="text-xs mt-2">(Current view: {devicePreview})</p>
           {isDraggingOver && <p className="text-xs mt-2 text-primary font-semibold">Release to drop component</p>}
        </div>
      </div>
    </div>
  );
}
