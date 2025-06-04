
"use client";

import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDraggable } from '@dnd-kit/core';

interface DraggableComponentItemProps {
  id: string; 
  icon: LucideIcon;
  label: string;
  description: string;
}

export function DraggableComponentItem({ id, icon: Icon, label, description }: DraggableComponentItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `sidebar-item-${id}`, // Unique ID for sidebar items
    data: {
      type: id,
      label: label,
      isSidebarItem: true, // Flag to identify items dragged from sidebar
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000, // Ensure it's on top while dragging
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        // draggable="true" // useDraggable handles this
        // onDragStart={handleDragStart} // useDraggable handles this
        className="p-3 hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing mb-2 bg-card border border-border rounded-md"
        role="button"
        tabIndex={0}
        aria-label={`Add ${label} component`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-grow">
            <p className="font-medium font-headline text-sm text-card-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
