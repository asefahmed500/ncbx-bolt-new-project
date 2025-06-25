
"use client";

import React from 'react';
import type { DeviceType } from './app-header';
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, Package, Image as ImageIconLucide, Type as TypeIcon, Square as ButtonIcon, Columns, Box } from 'lucide-react';
import type { IWebsiteVersionPage, IPageComponent } from '@/models/WebsiteVersion';
import Image from 'next/image';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useDroppable } from '@dnd-kit/core';
import { getComponentConfig } from './componentRegistry';

interface CanvasEditorProps {
  devicePreview: DeviceType;
  page: IWebsiteVersionPage;
  pageIndex: number;
  onElementSelect: (elementId: string, pageIndex: number) => void;
  isDragging: boolean;
  activeDragId: string | null;
}

// Recursive component to render elements and their nested structures
const RenderElement = ({ element, pageIndex, onElementSelect, path }: { element: IPageComponent; pageIndex: number; onElementSelect: CanvasEditorProps['onElementSelect']; path: string }) => {
  const componentConf = getComponentConfig(element.type);
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `${element._id as string}`, // Each element is a droppable zone
  });

  const renderSimplePlaceholder = (el: IPageComponent) => {
    let Icon = Package;
    let contentPreview = `Type: ${el.type}`;
    if (el.type === 'heading' && el.config?.text) { Icon = TypeIcon; contentPreview = `${el.config.text}`; }
    else if (el.type === 'text') { Icon = TypeIcon; contentPreview = "Rich Text Block"; }
    else if (el.type === 'image') { Icon = ImageIconLucide; contentPreview = el.config?.alt || "Image"; }
    else if (el.type === 'button' && el.config?.text) { Icon = ButtonIcon; contentPreview = `Button: ${el.config.text}`; }

    return (
      <div
        onClick={() => onElementSelect((el._id as string), pageIndex)}
        className="p-3 border border-dashed border-muted-foreground/30 rounded-md hover:border-primary hover:bg-primary/5 cursor-pointer transition-all bg-card dark:bg-neutral-800 my-1 flex items-center text-xs text-muted-foreground"
      >
        <Icon className="w-4 h-4 mr-2 text-primary/70 flex-shrink-0" />
        <span className="font-medium text-primary/90 capitalize flex-grow truncate" title={contentPreview}>{contentPreview}</span>
        <span className="ml-2 text-muted-foreground/70 text-xs whitespace-nowrap">Order: {el.order}</span>
      </div>
    );
  };

  const renderContainer = (el: IPageComponent, children: React.ReactNode, droppableId: string, Icon: React.ElementType, title: string) => {
    const { setNodeRef: setContainerDroppableRef, isOver: isContainerOver } = useDroppable({ id: droppableId });

    return (
      <div ref={setContainerDroppableRef} className={`p-2 my-1 border rounded-md transition-colors ${isContainerOver ? 'border-primary bg-primary/10' : 'border-dashed border-muted-foreground/30'}`}>
        <div onClick={() => onElementSelect((el._id as string), pageIndex)} className="text-xs text-muted-foreground flex items-center mb-2 p-1 rounded bg-muted/50 cursor-pointer">
            <Icon className="w-4 h-4 mr-2" />
            {title}
        </div>
        <div className="min-h-[50px] pl-4 border-l-2 border-dashed border-muted-foreground/20">
            {children}
        </div>
      </div>
    );
  };

  if (componentConf?.isContainer) {
    if (element.type === 'section' && element.config?.elements) {
      return (
        <SortableItem key={element._id as string} id={element._id as string}>
          {renderContainer(element, (
            <SortableContext items={element.config.elements.map((e: IPageComponent) => e._id as string)} strategy={verticalListSortingStrategy}>
              {element.config.elements.length > 0 ? (
                element.config.elements.map((child: IPageComponent, index: number) => (
                  <RenderElement key={child._id as string} element={child} pageIndex={pageIndex} onElementSelect={onElementSelect} path={`${path}.config.elements.${index}`} />
                ))
              ) : <div className="text-xs text-muted-foreground py-4 text-center">Drop components here</div>}
            </SortableContext>
          ), `${element._id as string}-dropzone`, Box, 'Section')}
        </SortableItem>
      );
    }
    if (element.type === 'columns' && Array.isArray(element.config?.columns)) {
        return (
            <SortableItem key={element._id as string} id={element._id as string}>
                <div ref={setDroppableNodeRef} className="my-1 border-dashed border-muted-foreground/30 rounded-md border p-2">
                    <div onClick={() => onElementSelect(element._id as string, pageIndex)} className="text-xs text-muted-foreground flex items-center mb-2 p-1 rounded bg-muted/50 cursor-pointer">
                        <Columns className="w-4 h-4 mr-2" />
                        Columns
                    </div>
                    <div className="flex gap-4">
                        {element.config.columns.map((col: { id: string, elements: IPageComponent[] }, colIndex: number) => {
                            const droppableId = `${element._id as string}-col-${colIndex}`;
                            const { setNodeRef: setColDroppableRef, isOver: isColOver } = useDroppable({ id: droppableId });
                            return (
                                <div key={col.id} ref={setColDroppableRef} className={`flex-1 p-2 rounded min-h-[50px] transition-colors ${isColOver ? 'bg-primary/10' : 'bg-muted/30'}`}>
                                    <SortableContext items={col.elements.map(e => e._id as string)} strategy={verticalListSortingStrategy}>
                                        {col.elements.length > 0 ? (
                                            col.elements.map((child: IPageComponent, index: number) => (
                                                <RenderElement key={child._id as string} element={child} pageIndex={pageIndex} onElementSelect={onElementSelect} path={`${path}.config.columns[${colIndex}].elements.${index}`} />
                                            ))
                                        ) : <div className="text-xs text-muted-foreground py-4 text-center">Drop here</div>}
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SortableItem>
        );
    }
  }

  // Fallback for non-containers or misconfigured containers
  return (
    <SortableItem key={element._id as string} id={element._id as string}>
      <div ref={setDroppableNodeRef}>
        {renderSimplePlaceholder(element)}
      </div>
    </SortableItem>
  );
};

export function CanvasEditor({ devicePreview, page, pageIndex, onElementSelect, isDragging, activeDragId }: CanvasEditorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-area',
  });

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
          padding: '20px',
          boxSizing: 'border-box',
          backgroundImage: 'radial-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <div ref={setNodeRef}>
          <SortableContext
            items={elementsToRender.map(el => el._id as string)}
            strategy={verticalListSortingStrategy}
          >
            {elementsToRender.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none min-h-[300px] rounded-md transition-colors ${isOver ? 'bg-primary/10' : ''}`}>
                <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">Canvas Editor ({page?.name || 'Page'})</p>
                <p className="text-sm">Drag components here to build your page.</p>
                 {isOver && <p className="text-xs mt-2 text-primary font-semibold">Release to drop component</p>}
              </div>
            ) : (
              elementsToRender.map((element, index) => (
                <RenderElement key={element._id as string} element={element} pageIndex={pageIndex} onElementSelect={onElementSelect} path={`elements.${index}`} />
              ))
            )}
          </SortableContext>
           {isOver && elementsToRender.length > 0 && (
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
