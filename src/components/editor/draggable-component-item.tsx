
"use client";

import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DraggableComponentItemProps {
  id: string; // Add id to identify the component type
  icon: LucideIcon;
  label: string;
  description: string;
}

export function DraggableComponentItem({ id, icon: Icon, label, description }: DraggableComponentItemProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ type: id, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      draggable="true"
      onDragStart={handleDragStart}
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
  );
}
