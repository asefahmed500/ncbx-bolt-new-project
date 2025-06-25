
"use client";

import React from 'react';
import type { DeviceType } from './app-header';
import { LayoutGrid, Package, Box, Columns, Type as TypeIcon, Square as ButtonIcon, Image as ImageIconLucide } from 'lucide-react';
import type { IWebsiteVersionPage, IPageComponent } from '@/models/WebsiteVersion';
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

const RenderElement = ({ element, pageIndex, onElementSelect }: { element: IPageComponent; pageIndex: number; onElementSelect: CanvasEditorProps['onElementSelect']; }) => {
  const componentConf = getComponentConfig(element.type);

  const renderSimplePlaceholder = (el: IPageComponent) => {
    let Icon = Package;
    let contentPreview = `Type: ${el.type}`;
    if (el.type === 'heading' && el.config?.text) { Icon = TypeIcon; contentPreview = `${el.config.text}`; }
    else if (el.type === 'text') { Icon = TypeIcon; contentPreview = "Rich Text Block"; }
    else if (el.type === 'image') { Icon = ImageIconLucide; contentPreview = el.config?.alt || "Image"; }
    else if (el.type === 'button' && el.config?.text) { Icon = ButtonIcon; contentPreview = `Button: ${el.config.text}`; }

    return (
      <div
        onClick={(e) => { e.stopPropagation(); onElementSelect((el._id as string), pageIndex); }}
        className="p-3 border border-dashed border-muted-foreground/30 rounded-md hover:border-primary hover:bg-primary/5 cursor-pointer transition-all bg-card dark:bg-neutral-800 my-1 flex items-center text-xs text-muted-foreground"
      >
        <Icon className="w-4 h-4 mr-2 text-primary/70 flex-shrink-0" />
        <span className="font-medium text-primary/90 capitalize flex-grow truncate" title={contentPreview}>{contentPreview}</span>
      </div>
    );
  };

  const renderContainer = (el: IPageComponent, droppableId: string, Icon: React.ElementType, title: string) => {
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });
    const nestedElements = (el.config?.elements as IPageComponent[]) || [];

    return (
      <div ref={setNodeRef} className={`p-2 my-1 border rounded-md transition-colors ${isOver ? 'border-primary bg-primary/10' : 'border-dashed border-muted-foreground/30'}`}>
        <div onClick={(e) => { e.stopPropagation(); onElementSelect((el._id as string), pageIndex);}} className="text-xs text-muted-foreground flex items-center mb-2 p-1 rounded bg-muted/50 cursor-pointer">
            <Icon className="w-4 h-4 mr-2" />
            {title}
        </div>
        <div className="min-h-[50px] pl-4 border-l-2 border-dashed border-muted-foreground/20">
             <SortableContext items={nestedElements.map((e) => e._id as string)} strategy={verticalListSortingStrategy}>
              {nestedElements.length > 0 ? (
                nestedElements.map((child) => (
                  <RenderElement key={child._id as string} element={child} pageIndex={pageIndex} onElementSelect={onElementSelect} />
                ))
              ) : <div className={`text-xs text-muted-foreground py-4 text-center ${isOver ? 'font-bold' : ''}`}>Drop components here</div>}
            </SortableContext>
        </div>
      </div>
    );
  };

  if (componentConf?.isContainer) {
    if (element.type === 'section') {
      return (
        <SortableItem key={element._id as string} id={element._id as string}>
          {renderContainer(element, `${element._id as string}`, Box, 'Section')}
        </SortableItem>
      );
    }
    if (element.type === 'columns' && Array.isArray(element.config?.columns)) {
        return (
            <SortableItem key={element._id as string} id={element._id as string}>
                 <div className="my-1 border-dashed border-muted-foreground/30 rounded-md border p-2">
                    <div onClick={(e) => { e.stopPropagation(); onElementSelect(element._id as string, pageIndex); }} className="text-xs text-muted-foreground flex items-center mb-2 p-1 rounded bg-muted/50 cursor-pointer">
                        <Columns className="w-4 h-4 mr-2" />
                        Columns
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        {element.config.columns.map((col: { id: string; elements: IPageComponent[] }, colIndex: number) => {
                            const droppableId = col.id; // Use the persistent ID
                            const { setNodeRef: setColDroppableRef, isOver: isColOver } = useDroppable({ id: droppableId });
                            return (
                                <div key={droppableId} ref={setColDroppableRef} className={`flex-1 p-2 rounded min-h-[50px] transition-colors ${isColOver ? 'bg-primary/10 border-2 border-dashed border-primary' : 'bg-muted/30'}`}>
                                    <SortableContext items={col.elements.map(e => e._id as string)} strategy={verticalListSortingStrategy}>
                                        {col.elements.length > 0 ? (
                                            col.elements.map((child: IPageComponent) => (
                                                <RenderElement key={child._id as string} element={child} pageIndex={pageIndex} onElementSelect={onElementSelect} />
                                            ))
                                        ) : <div className={`text-xs text-muted-foreground py-4 text-center ${isColOver ? 'font-bold' : ''}`}>Drop here</div>}
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

  // Fallback for all non-container elements
  return (
    <SortableItem key={element._id as string} id={element._id as string}>
      <div>
        {renderSimplePlaceholder(element)}
      </div>
    </SortableItem>
  );
};


export function CanvasEditor({ devicePreview, page, pageIndex, onElementSelect, isDragging, activeDragId }: CanvasEditorProps) {
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
          padding: '20px',
          boxSizing: 'border-box',
          backgroundImage: 'radial-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px)',
          backgroundSize: '15px 15px',
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <div ref={setNodeRef} className="h-full">
          <SortableContext items={elementsToRender.map(el => el._id as string)} strategy={verticalListSortingStrategy}>
            {elementsToRender.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full text-muted-foreground pointer-events-none select-none min-h-[300px] rounded-md transition-colors ${isOver && isDragging ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}>
                <LayoutGrid className="w-16 h-16 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">Canvas Editor ({page?.name || 'Page'})</p>
                <p className="text-sm">Drag components here to build your page.</p>
              </div>
            ) : (
              elementsToRender.map((element) => (
                <RenderElement key={element._id as string} element={element} pageIndex={pageIndex} onElementSelect={onElementSelect} />
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
