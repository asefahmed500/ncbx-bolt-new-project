
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DraggableComponentItem } from "./draggable-component-item";
import { Type, Image as ImageIcon, Square, Box, Columns, Heading1, Minus, Layers, Code2, Video, Edit3, MapPin, ListChecks, Search as SearchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Added for search placeholder

// TODO: In the future, components could be grouped by category
// e.g., const componentCategories = { Basic: [], Layout: [], Media: [], Forms: [] };
const components = [
  { id: "heading", label: "Heading", icon: Heading1, description: "For titles and subheadings (H1-H6)." },
  { id: "text", label: "Rich Text Block", icon: Type, description: "Paragraphs, lists, and formatted text." },
  { id: "image", label: "Image", icon: ImageIcon, description: "Embed single images or create galleries." },
  { id: "button", label: "Button", icon: Square, description: "Interactive call-to-action links." },
  { id: "video", label: "Video", icon: Video, description: "Embed videos from various sources." },
  { id: "section", label: "Section / Container", icon: Box, description: "Group content into distinct sections." },
  { id: "columns", label: "Columns Layout", icon: Columns, description: "Arrange content in responsive columns." },
  { id: "divider", label: "Divider", icon: Minus, description: "Add a visual horizontal separator." },
  { id: "form", label: "Form Container", icon: ListChecks, description: "Group form input fields for submissions." },
  { id: "input", label: "Form Input Field", icon: Edit3, description: "For text, email, number, etc. inputs." },
  { id: "textarea_field", label: "Form Textarea", icon: Edit3, description: "For multi-line text input areas." },
  { id: "map_embed", label: "Map Embed", icon: MapPin, description: "Embed maps (e.g., Google Maps)." },
  { id: "customCode", label: "Custom Code", icon: Code2, description: "Embed HTML, CSS, or JS snippets." },
];

export function ComponentLibrarySidebar() {
  // const [searchTerm, setSearchTerm] = useState(""); // State for search functionality
  // const filteredComponents = components.filter(c => c.label.toLowerCase().includes(searchTerm.toLowerCase()));

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
        {/* TODO: Implement categorization rendering here if componentCategories is used */}
        <div className="space-y-2">
          {/* Replace 'components' with 'filteredComponents' when search is implemented */}
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
