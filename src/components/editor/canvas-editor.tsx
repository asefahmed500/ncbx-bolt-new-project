
"use client";

import React from 'react';
import type { DeviceType } from './app-header';
import { LayoutGrid } from 'lucide-react';
import type { IWebsiteVersionPage, IPageComponent } from '@/models/WebsiteVersion';
import type { INavigation } from '@/models/Navigation';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useDroppable } from '@dnd-kit/core';
import ElementRenderer from '@/components/site-renderer/ElementRenderer';

interface CanvasEditorProps {
  devicePreview: DeviceType;
  page: IWebsiteVersionPage;
  pageIndex: number;
  selectedElementId?: string | null;
  onElementSelect: (elementId: string, pageIndex: number) => void;
  isDragging: boolean;
  activeDragId: string | null;
  allNavigations?: INavigation[];
}

const EditorCanvasElement = ({ 
  element, 
  pageIndex, 
  onElementSelect,
  isSelected,
  allNavigations
}: { 
  element: IPageComponent; 
  pageIndex: number; 
  onElementSelect: CanvasEditorProps['onElementSelect'];
  isSelected: boolean;
  allNavigations?: INavigation[];
}) => {
  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser actions (e.g., following a link) when selecting in the editor.
    e.stopPropagation();
    onElementSelect(element._id as string, pageIndex);
  };

  return (
    <SortableItem key={element._id as string} id={element._id as string}>
       <div 
        onClick={handleSelect}
        className={`relative p-1 my-1 cursor-pointer transition-all ${ isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50' }`}
      >
        <div>
          <ElementRenderer element={element} allNavigations={allNavigations} />
        </div>
        {isSelected && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full z-10">
            {element.type}
          </div>
        )}
      </div>
    </SortableItem>
  );
};


export function CanvasEditor({ devicePreview, page, pageIndex, selectedElementId, onElementSelect, isDragging, activeDragId, allNavigations }: CanvasEditorProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-area' });

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': default: return '100%';
    }
  };

  const elementsToRender: IPageComponent[] = page?.elements || [];

  return (
    <div className="flex-1 bg-muted/50 p-1 md:p-2 lg:p-4 rounded-lg shadow-inner flex justify-center items-start overflow-auto">
      <div
        className="bg-background shadow-lg transition-all duration-200 ease-in-out mx-auto relative"
        style={{
          width: getCanvasWidth(),
          minHeight: devicePreview === 'desktop' ? 'calc(100% - 0rem)' : '812px',
          padding: '0', // Let sections handle their own padding
          boxSizing: 'border-box',
          backgroundImage: 'radial-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <div ref={setNodeRef} className="h-full">
          <SortableContext items={elementsToRender.map(el => el._id as string)} strategy={verticalListSortingStrategy}>
            {elementsToRender.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full text-muted-foreground select-none min-h-[300px] rounded-md transition-colors ${isOver && isDragging ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}>
                <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">Canvas Editor ({page?.name || 'Page'})</p>
                <p className="text-sm">Drag components here to build your page.</p>
              </div>
            ) : (
              elementsToRender.map((element) => (
                <EditorCanvasElement 
                  key={element._id as string} 
                  element={element} 
                  pageIndex={pageIndex} 
                  onElementSelect={onElementSelect} 
                  isSelected={(element._id as string) === selectedElementId}
                  allNavigations={allNavigations}
                />
              ))
            )}
          </SortableContext>
           {isOver && elementsToRender.length > 0 && isDragging && (
              <div className="p-3 mt-1 border-2 border-dashed border-primary rounded-md bg-primary/10 text-center text-xs text-primary font-semibold">
                  Drop here to add to the bottom of the page
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

declare module '@/models/WebsiteVersion' {
  interface IPageComponent {
    _id?: string | import('mongoose').Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  }
   interface IWebsiteVersionPage {
    _id?: string | import('mongoose').Types.ObjectId;
  }
}
