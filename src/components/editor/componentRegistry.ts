
import type { LucideIcon } from 'lucide-react';
import { 
  Type, 
  Image as ImageIcon, 
  Square as ButtonIcon, // Renamed to avoid conflict with Button component
  Box, 
  Columns, 
  Heading1, 
  Minus, 
  Code2, 
  Video, 
  Edit3, 
  MapPin, 
  ListChecks 
} from "lucide-react";

export interface ComponentConfig {
  id: string; // This should match the 'type' in PageComponentSchema
  label: string;
  icon: LucideIcon;
  description: string;
  // Placeholder for the actual render function for the canvas - for future use
  // render?: (props: any) => JSX.Element; 
  // Placeholder for the property panel component for this type - for future use
  // propertyPanel?: (props: { elementData: any, onUpdate: (updates: any) => void }) => JSX.Element;
}

export const componentRegistry: Record<string, ComponentConfig> = {
  heading: { 
    id: "heading", 
    label: "Heading", 
    icon: Heading1, 
    description: "For titles and subheadings (H1-H6)." 
  },
  text: { 
    id: "text", 
    label: "Rich Text Block", 
    icon: Type, 
    description: "Paragraphs, lists, and formatted text." 
  },
  image: { 
    id: "image", 
    label: "Image", 
    icon: ImageIcon, 
    description: "Embed single images or create galleries." 
  },
  button: { 
    id: "button", 
    label: "Button", 
    icon: ButtonIcon, 
    description: "Interactive call-to-action links." 
  },
  video: { 
    id: "video", 
    label: "Video", 
    icon: Video, 
    description: "Embed videos from various sources." 
  },
  section: { 
    id: "section", 
    label: "Section / Container", 
    icon: Box, 
    description: "Group content into distinct sections." 
  },
  columns: { 
    id: "columns", 
    label: "Columns Layout", 
    icon: Columns, 
    description: "Arrange content in responsive columns." 
  },
  divider: { 
    id: "divider", 
    label: "Divider", 
    icon: Minus, 
    description: "Add a visual horizontal separator." 
  },
  form: { 
    id: "form", 
    label: "Form Container", 
    icon: ListChecks, 
    description: "Group form input fields for submissions." 
  },
  input: { 
    id: "input", 
    label: "Form Input Field", 
    icon: Edit3, 
    description: "For text, email, number, etc. inputs." 
  },
  textarea_field: { 
    id: "textarea_field", 
    label: "Form Textarea", 
    icon: Edit3, 
    description: "For multi-line text input areas." 
  },
  map_embed: { 
    id: "map_embed", 
    label: "Map Embed", 
    icon: MapPin, 
    description: "Embed maps (e.g., Google Maps)." 
  },
  customCode: { 
    id: "customCode", 
    label: "Custom Code", 
    icon: Code2, 
    description: "Embed HTML, CSS, or JS snippets." 
  },
};

export const getRegisteredComponents = (): ComponentConfig[] => {
  return Object.values(componentRegistry);
};

// Helper function to get a specific component's configuration
export const getComponentConfig = (type: string): ComponentConfig | undefined => {
  return componentRegistry[type];
};
