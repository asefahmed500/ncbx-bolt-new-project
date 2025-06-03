
"use client";

import { useState } from 'react';
import type { DeviceType } from './app-header';
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, Package } from 'lucide-react';
import type { IWebsiteVersionPage, IPageComponent } from '@/models/Website'; // Assuming this is the correct path

export interface CanvasElementPlaceholder extends IPageComponent {
  // any additional client-side properties for rendering or interaction if needed
}
interface CanvasEditorProps {
  devicePreview: DeviceType;
  pages: IWebsiteVersionPage[]; // Now expects full page data
  onElementSelect: (elementId: string, pageIndex: number) => void;
  onDropComponent: (componentType: string, pageIndex: number, targetOrder?: number) => void; // For dropping new components
}

export function CanvasEditor({ devicePreview, pages, onElementSelect, onDropComponent }: CanvasEditorProps) {
  const { toast } = useToast();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedOverElementId, setDraggedOverElementId] = useState<string | null>(null);

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

  const handleDragEnterCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('application/json')) {
      setIsDraggingOver(true);
      event.dataTransfer.dropEffect = "copy"; // Changed from "move" to "copy" for new components
    } else {
      event.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeaveCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDraggingOver(false);
    }
  };

  const handleDragOverCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
    if (event.dataTransfer.types.includes('application/json')) {
      event.dataTransfer.dropEffect = "copy";
      if (!isDraggingOver) setIsDraggingOver(true);
    } else {
      event.dataTransfer.dropEffect = "none";
    }
  };

  const handleDropOnCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const dataString = event.dataTransfer.getData('application/json');
    if (dataString) {
      try {
        const componentData = JSON.parse(dataString); // Expected: { type: string, label: string }
        // Assuming single page editing for now, pageIndex 0
        // targetOrder can be calculated based on drop position if elements are draggable within canvas
        onDropComponent(componentData.type, 0, pages[0]?.elements.length || 0); 
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

  // For now, we'll render elements from the first page if available
  const currentPage = pages && pages.length > 0 ? pages[0] : null;
  const elementsToRender: CanvasElementPlaceholder[] = currentPage ? currentPage.elements as CanvasElementPlaceholder[] : [];

  return (
    <div 
      className="flex-1 bg-muted/50 p-6 rounded-lg shadow-inner flex justify-center items-start overflow-auto"
      onDragEnter={handleDragEnterCanvas}
      onDragLeave={handleDragLeaveCanvas}
      onDragOver={handleDragOverCanvas}
      onDrop={handleDropOnCanvas}
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
          opacity: isDraggingOver ? 0.85 : 1,
          backgroundImage: 'radial-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        {elementsToRender.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none">
            <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">Canvas Editor</p>
            <p className="text-sm">Drag components here from the library to build your page.</p>
            <p className="text-xs mt-2">(Current view: {devicePreview})</p>
            {isDraggingOver && <p className="text-xs mt-2 text-primary font-semibold">Release to drop component</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {elementsToRender.map((element, index) => (
              <div
                key={(element._id as unknown as string) || `el-${index}`} // Use element._id if available
                onClick={() => onElementSelect((element._id as unknown as string), 0)} // Assuming pageIndex 0 for now
                className="p-3 border border-dashed border-muted-foreground/30 rounded-md hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                style={{ order: element.order }} // Conceptual, full reordering needs dnd-kit
              >
                <div className="flex items-center text-xs text-muted-foreground">
                  <Package className="w-3 h-3 mr-2 text-primary/70" />
                  <span className="font-medium text-primary/90 capitalize">{element.type}</span>
                  <span className="ml-2 text-muted-foreground/70">Order: {element.order}</span>
                </div>
                {/* Basic preview of config - highly conceptual */}
                <div className="mt-1 text-xs text-muted-foreground/80 truncate">
                  {element.type === 'heading' && element.config?.text && `Text: ${element.config.text}`}
                  {element.type === 'text' && element.config?.htmlContent && `Content: ${element.config.htmlContent.substring(0,30)}...`}
                  {element.type === 'image' && element.config?.src && `Src: ${element.config.src}`}
                  {element.type === 'button' && element.config?.text && `Button: ${element.config.text}`}
                </div>
              </div>
            ))}
            {isDraggingOver && (
                <div className="p-3 border-2 border-dashed border-primary rounded-md bg-primary/10 text-center text-xs text-primary font-semibold">
                    Drop here to add component
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Ensure IPageComponent has _id, createdAt, updatedAt if they are expected (Mongoose does this for subdocs with _id: true)
declare module '@/models/Website' {
  interface IPageComponent {
    _id?: string | import('mongoose').Types.ObjectId; // Make _id optional or ensure it's always there
    createdAt?: Date;
    updatedAt?: Date;
  }
   interface IWebsiteVersionPage {
    _id?: string | import('mongoose').Types.ObjectId;
  }
}
