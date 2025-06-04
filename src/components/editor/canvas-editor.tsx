
"use client";

import type { DeviceType } from './app-header';
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, Package, Image as ImageIconLucide, Type as TypeIcon, Square as ButtonIcon } from 'lucide-react';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion'; 
import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image'; 
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useDroppable } from '@dnd-kit/core';

interface CanvasEditorProps {
  devicePreview: DeviceType;
  page: IWebsiteVersionPage; 
  pageIndex: number;
  onElementSelect: (elementId: string, pageIndex: number) => void;
  // onDropComponent: (componentType: string, targetOrder?: number) => void; // Removed for now, handled by DndContext in parent
}

export function CanvasEditor({ devicePreview, page, pageIndex, onElementSelect }: CanvasEditorProps) {
  const { toast } = useToast();
  // const [isDraggingOver, setIsDraggingOver] = useState(false); // DndContext in parent handles this now

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-area', // Unique ID for the canvas drop zone
  });

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': default: return '100%';
    }
  };

  const elementsToRender: IPageComponent[] = page?.elements || [];

  const renderElementPlaceholder = (element: IPageComponent, index: number) => {
    let Icon = Package;
    let contentPreview = `Type: ${element.type}`;
    if (element.type === 'heading' && element.config?.text) {
      Icon = TypeIcon;
      contentPreview = `${element.config.text}`;
    } else if (element.type === 'text') {
      Icon = TypeIcon;
      contentPreview = "Rich Text Block - Click to edit";
    } else if (element.type === 'image') {
      Icon = ImageIconLucide;
      contentPreview = element.config?.alt ? `Image: ${element.config.alt}` : element.config?.src ? `Image: ${String(element.config.src).substring(0,30)}...` : "Image";
    } else if (element.type === 'button' && element.config?.text) {
      Icon = ButtonIcon;
      contentPreview = `Button: ${element.config.text}`;
    }

    return (
      <div
        key={(element._id as unknown as string) || `el-${index}`} 
        onClick={() => onElementSelect((element._id as unknown as string), pageIndex)} 
        className="p-3 border border-dashed border-muted-foreground/30 rounded-md hover:border-primary hover:bg-primary/5 cursor-pointer transition-all bg-card dark:bg-neutral-800 my-1" // Use bg-card for consistency
        style={{ order: element.order }} 
      >
        <div className="flex items-center text-xs text-muted-foreground">
          <Icon className="w-4 h-4 mr-2 text-primary/70" />
          <span className="font-medium text-primary/90 capitalize flex-grow truncate" title={contentPreview}>{contentPreview}</span>
          <span className="ml-2 text-muted-foreground/70 text-xs whitespace-nowrap">Order: {element.order}</span>
        </div>
        {element.type === 'image' && element.config?.src && (
          <div className="mt-2 overflow-hidden rounded max-h-20 flex justify-center items-center bg-muted">
            <Image 
                src={element.config.src as string} 
                alt={element.config.alt as string || 'Preview'} 
                width={80} 
                height={80} 
                className="object-contain max-h-20" 
                data-ai-hint={element.config.dataAiHint as string || 'placeholder image'}
                onError={(e) => e.currentTarget.style.display='none'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef} // Make the canvas itself a droppable area
      className="flex-1 bg-muted/50 p-1 md:p-2 lg:p-4 rounded-lg shadow-inner flex justify-center items-start overflow-auto"
    >
      <div 
        className="bg-background shadow-lg transition-all duration-200 ease-in-out mx-auto relative"
        style={{ 
          width: getCanvasWidth(), 
          minHeight: devicePreview === 'desktop' ? 'calc(100% - 0rem)' : '812px', 
          border: isOver ? '2px solid hsl(var(--primary))' : '2px dashed hsl(var(--border) / 0.5)',
          padding: '20px', 
          boxSizing: 'border-box',
          opacity: isOver ? 0.85 : 1,
          backgroundImage: 'radial-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <SortableContext 
            items={elementsToRender.map(el => el._id as string)} 
            strategy={verticalListSortingStrategy}
        >
          {elementsToRender.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none min-h-[300px]">
              <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">Canvas Editor ({page?.name || 'Page'})</p>
              <p className="text-sm">Drag components here to build your page.</p>
              {isOver && <p className="text-xs mt-2 text-primary font-semibold">Release to drop component</p>}
            </div>
          ) : (
            <div className="space-y-0"> {/* Reduced space for tighter packing */}
              {elementsToRender.map((element, index) => (
                <SortableItem key={element._id as string} id={element._id as string} className="canvas-element">
                  {renderElementPlaceholder(element, index)}
                </SortableItem>
              ))}
              {isOver && (
                  <div className="p-3 mt-1 border-2 border-dashed border-primary rounded-md bg-primary/10 text-center text-xs text-primary font-semibold">
                      Drop here to add component
                  </div>
              )}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

declare module '@/models/WebsiteVersion' { // Changed from Website
  interface IPageComponent {
    _id?: string | import('mongoose').Types.ObjectId; 
    createdAt?: Date;
    updatedAt?: Date;
  }
   interface IWebsiteVersionPage {
    _id?: string | import('mongoose').Types.ObjectId;
  }
}
