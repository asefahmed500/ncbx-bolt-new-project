
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { Type, Image as ImageIcon, Square, Box, Columns, Heading1, Minus, Layers } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const components = [
  { id: "heading", label: "Heading", icon: Heading1, description: "Add titles and subheadings." },
  { id: "text", label: "Rich Text Block", icon: Type, description: "Add and format text, paragraphs, and lists." },
  { id: "image", label: "Image", icon: ImageIcon, description: "Embed images and graphics." },
  { id: "button", label: "Button", icon: Square, description: "Create interactive call-to-action buttons." },
  { id: "section", label: "Section / Container", icon: Box, description: "Organize content into distinct sections or containers." },
  { id: "columns", label: "Columns Layout", icon: Columns, description: "Arrange content side-by-side in responsive columns." },
  { id: "divider", label: "Divider", icon: Minus, description: "Add a visual horizontal separator line." },
];

export function ComponentLibrarySidebar() {
  return (
    <aside className="w-72 bg-card border-r border-border p-4 flex flex-col shadow-sm">
      <ScrollArea className="flex-1 pr-2">
        <div className="mb-6"> {/* Section for Component Library */}
          <h2 className="text-lg font-headline font-semibold mb-4 text-foreground">Component Library</h2>
          <div className="space-y-2">
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
        </div>

        <Separator className="my-4" />

        <div className="mb-6"> {/* Section for Page Outline / Component Tree */}
          <h2 className="text-lg font-headline font-semibold mb-4 text-foreground flex items-center">
            <Layers className="w-5 h-5 mr-2 text-primary" />
            Page Outline
          </h2>
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">
                The structure of your page components (Component Tree) will appear here once implemented.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  );
}
