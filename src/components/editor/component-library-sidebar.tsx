
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { getRegisteredComponents, type ComponentConfig } from "./componentRegistry";
import { Layers } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ComponentLibrarySidebar() {
  const availableComponents: ComponentConfig[] = getRegisteredComponents();

  const groupedComponents = availableComponents.reduce((acc, component) => {
    const category = component.category || 'Advanced';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as Record<string, ComponentConfig[]>);

  const categoryOrder: ComponentConfig['category'][] = ['Layout', 'Typography', 'Media', 'Forms', 'Navigation', 'Content Sections', 'Advanced'];

  return (
    <aside className="w-72 bg-card border-r border-border p-4 flex flex-col shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-headline font-semibold mb-2 text-foreground">Component Library</h2>
      </div>

      <ScrollArea className="flex-1 -mx-4 pr-1">
        <Accordion type="multiple" defaultValue={categoryOrder} className="w-full px-4">
          {categoryOrder.map(category => groupedComponents[category] && (
            <AccordionItem value={category} key={category} className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                {category}
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-2">
                {groupedComponents[category].map((component) => (
                  <DraggableComponentItem
                    key={component.id}
                    id={component.id}
                    icon={component.icon}
                    label={component.label}
                    description={component.description}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      <Separator className="my-4" />

      <div className="mt-auto">
        <h2 className="text-lg font-headline font-semibold mb-2 text-foreground flex items-center">
          <Layers className="w-5 h-5 mr-2 text-primary" />
          Page Outline
        </h2>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              The hierarchical structure of your page components (Component Tree) will appear here once you add elements to the canvas. This helps in selecting and reorganizing nested items. (Conceptual)
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
