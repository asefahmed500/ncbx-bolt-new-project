
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { Type, Image as ImageIcon, Square, Box, Columns, Heading1, Minus, Bold, Italic, Underline, List, Quote } from "lucide-react";

const components = [
  { id: "heading", label: "Heading", icon: Heading1, description: "Add titles and subheadings." },
  { id: "text", label: "Text Block", icon: Type, description: "Add and edit paragraphs." },
  { id: "image", label: "Image", icon: ImageIcon, description: "Embed images and graphics." },
  { id: "button", label: "Button", icon: Square, description: "Create interactive buttons." },
  { id: "section", label: "Section", icon: Box, description: "Organize content into sections." },
  { id: "columns", label: "Columns", icon: Columns, description: "Arrange content in columns." },
  { id: "divider", label: "Divider", icon: Minus, description: "Add a horizontal line." },
  // Example of more specific components if needed later
  // { id: "paragraph", label: "Paragraph", icon: Pilcrow, description: "For longer text content." },
  // { id: "list", label: "List", icon: List, description: "Create bulleted or numbered lists." },
  // { id: "quote", label: "Quote", icon: Quote, description: "Highlight a quotation." },
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
              id={component.id}
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
