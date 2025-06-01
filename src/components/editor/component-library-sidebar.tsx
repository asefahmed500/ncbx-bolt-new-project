
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { getRegisteredComponents, type ComponentConfig } from "./componentRegistry"; // Import from registry
import { Layers, Search as SearchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input"; // For future search functionality

export function ComponentLibrarySidebar() {
  // const [searchTerm, setSearchTerm] = useState(""); // State for search functionality
  
  // Get components from the registry
  const availableComponents: ComponentConfig[] = getRegisteredComponents();

  // const filteredComponents = availableComponents.filter(c => 
  //   c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   c.description.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <aside className="w-72 bg-card border-r border-border p-4 flex flex-col shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-headline font-semibold mb-2 text-foreground">Component Library</h2>
        {/* Placeholder for Search Input - Future enhancement */}
        {/* 
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search components..." 
            className="pl-8 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div> 
        */}
      </div>

      <ScrollArea className="flex-1 pr-2">
        {/* TODO: Implement categorization rendering here if componentCategories is used in registry */}
        <div className="space-y-2">
          {/* Use 'availableComponents' or 'filteredComponents' when search is implemented */}
          {availableComponents.map((component) => (
            <DraggableComponentItem
              key={component.id}
              id={component.id} // Pass the component id (type)
              icon={component.icon}
              label={component.label}
              description={component.description}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator className="my-4" />

      <div className="mt-auto"> {/* Pushes Page Outline to the bottom */}
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
