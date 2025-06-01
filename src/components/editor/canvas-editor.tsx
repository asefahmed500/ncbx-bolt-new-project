
"use client";

import type { DeviceType } from './app-header'; // Assuming DeviceType is exported from app-header
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid } from 'lucide-react';

interface CanvasEditorProps {
  devicePreview: DeviceType;
}

export function CanvasEditor({ devicePreview }: CanvasEditorProps) {
  const { toast } = useToast();

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return '375px'; // Common mobile width
      case 'tablet':
        return '768px'; // Common tablet width
      case 'desktop':
      default:
        return '100%'; // Full width for desktop
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('application/json');
    if (dataString) {
      try {
        const componentData = JSON.parse(dataString);
        console.log("Dropped component:", componentData);
        // For now, just show a toast. Later, this will add the component to the canvas state.
        toast({
          title: "Component Dropped",
          description: `"${componentData.label}" component was added to the canvas (conceptually).`,
        });
        // Here you would typically update the canvas state with the new component.
        // e.g., setCanvasElements(prev => [...prev, { type: componentData.type, id: new Date().toISOString() ...config }]);
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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div 
        className="bg-background shadow-lg transition-all duration-300 ease-in-out mx-auto relative"
        style={{ 
          width: getCanvasWidth(), 
          height: devicePreview === 'desktop' ? 'calc(100% - 0rem)' : '812px', // Adjusted height
          minHeight: '400px',
          border: '2px dashed hsl(var(--border) / 0.5)', // More prominent dashed border
          padding: '20px', // Padding inside the canvas
          boxSizing: 'border-box',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        {/* Placeholder content for the canvas */}
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none">
          <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Canvas Editor</p>
          <p className="text-sm">Drag components here to build your website.</p>
          <p className="text-xs mt-2">(Current view: {devicePreview})</p>
        </div>
        {/* Actual dropped components would be rendered here based on state */}
      </div>
    </div>
  );
}
