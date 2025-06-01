"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { Type, Image as ImageIcon, Square, Box, Columns, Heading1, Minus } from "lucide-react";

const components = [
  { id: "text", label: "Text", icon: Type, description: "Add and edit text blocks." },
  { id: "heading", label: "Heading", icon: Heading1, description: "Add titles and subheadings." },
  { id: "image", label: "Image", icon: ImageIcon, description: "Embed images and graphics." },
  { id: "button", label: "Button", icon: Square, description: "Create interactive buttons." },
  { id: "section", label: "Section", icon: Box, description: "Organize content into sections." },
  { id: "columns", label: "Columns", icon: Columns, description: "Arrange content in columns." },
  { id: "divider", label: "Divider", icon: Minus, description: "Add a horizontal line." },
];

export function ComponentLibrarySidebar() {
  return (
    <aside className="w-72 bg-card border-r border-border p-4 flex flex-col shadow-sm">
      <h2 className="text-lg font-headline font-semibold mb-4 text-foreground">Component Library</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {components.map((component) => (
            <DraggableComponentItem
              key={component.id}
              icon={component.icon}
              label={component.label}
              description={component.description}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
