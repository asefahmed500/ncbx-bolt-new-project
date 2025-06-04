
import type { LucideIcon } from 'lucide-react';
import { 
  Type, 
  Image as ImageIcon, 
  Square as ButtonIconElement, 
  Box, 
  Columns, 
  Heading1, 
  Minus, 
  Code2, 
  Video, 
  Edit3, 
  MapPin, 
  ListChecks,
  PanelTop, // For Navbar
  AppWindow, // For Hero Section (or Zap, Sparkles, etc.)
  PanelBottom, // For Footer
  LayoutGrid // For Card Section
} from "lucide-react";

export interface ComponentConfig {
  id: string; 
  label: string;
  icon: LucideIcon;
  description: string;
  defaultConfig?: Record<string, any>; // Added default config for new components
}

export const componentRegistry: Record<string, ComponentConfig> = {
  heading: { 
    id: "heading", 
    label: "Heading", 
    icon: Heading1, 
    description: "For titles and subheadings (H1-H6).",
    defaultConfig: { text: "New Heading", level: "h2", color: "#333333", fontSize: "2rem", alignment: "left" },
  },
  text: { 
    id: "text", 
    label: "Rich Text Block", 
    icon: Type, 
    description: "Paragraphs, lists, and formatted text.",
    defaultConfig: { htmlContent: "<p>Start writing your content here...</p>", alignment: "left" },
  },
  image: { 
    id: "image", 
    label: "Image", 
    icon: ImageIcon, 
    description: "Embed single images or create galleries.",
    defaultConfig: { src: "https://placehold.co/600x400.png", alt: "Placeholder Image", width: "100%", height: "auto", dataAiHint: "placeholder" },
  },
  button: { 
    id: "button", 
    label: "Button", 
    icon: ButtonIconElement, 
    description: "Interactive call-to-action links.",
    defaultConfig: { text: "Click Me", link: "#", style: "primary", alignment: "left" },
  },
  navbar: {
    id: "navbar",
    label: "Navigation Bar",
    icon: PanelTop,
    description: "Site header with logo and links.",
    defaultConfig: { brandText: "MySite", links: [{ text: "Home", href: "/" }, { text: "About", href: "/about" }] },
  },
  hero: {
    id: "hero",
    label: "Hero Section",
    icon: AppWindow,
    description: "Prominent section with a title, subtitle, and CTA.",
    defaultConfig: { title: "Welcome to Our Site!", subtitle: "Amazing things happen here.", buttonText: "Learn More", buttonLink: "#", backgroundImage: "https://placehold.co/1200x600.png", dataAiHint: "abstract background" },
  },
  card_section: {
    id: "card_section",
    label: "Card Section",
    icon: LayoutGrid,
    description: "Display content in a series of cards.",
    defaultConfig: {
      title: "Featured Cards",
      cards: [
        { title: "Card 1", description: "Description for card 1", image: "https://placehold.co/300x200.png", dataAiHint: "feature item" },
        { title: "Card 2", description: "Description for card 2", image: "https://placehold.co/300x200.png", dataAiHint: "product service" },
        { title: "Card 3", description: "Description for card 3", image: "https://placehold.co/300x200.png", dataAiHint: "information block" },
      ]
    },
  },
  footer: {
    id: "footer",
    label: "Footer Section",
    icon: PanelBottom,
    description: "Site footer with copyright and links.",
    defaultConfig: { copyrightText: `© ${new Date().getFullYear()} MySite. All rights reserved.`, links: [{ text: "Privacy", href: "/privacy" }, { text: "Terms", href: "/terms" }] },
  },
  video: { 
    id: "video", 
    label: "Video", 
    icon: Video, 
    description: "Embed videos from various sources.",
    defaultConfig: { provider: "youtube", url: "VIDEO_ID_HERE", aspectRatio: "16:9" },
  },
  section: { 
    id: "section", 
    label: "Section / Container", 
    icon: Box, 
    description: "Group content into distinct sections.",
    defaultConfig: { backgroundColor: "#FFFFFF", paddingTop: "20px", paddingBottom: "20px" },
  },
  columns: { 
    id: "columns", 
    label: "Columns Layout", 
    icon: Columns, 
    description: "Arrange content in responsive columns.",
    defaultConfig: { count: 2, gap: "16px", layout: ["1fr", "1fr"] }, // Columns typically contain other elements
  },
  divider: { 
    id: "divider", 
    label: "Divider", 
    icon: Minus, 
    description: "Add a visual horizontal separator.",
    defaultConfig: { style: "solid", color: "#cccccc", height: "1px", marginY: "16px" },
  },
  // The following are more complex and might need more thought on defaultConfig for usability
  form: { 
    id: "form", 
    label: "Form Container", 
    icon: ListChecks, 
    description: "Group form input fields for submissions.",
    defaultConfig: { submitUrl: "/api/submit-form", buttonText: "Submit" }
  },
  input: { 
    id: "input", 
    label: "Form Input Field", 
    icon: Edit3, 
    description: "For text, email, number, etc. inputs.",
    defaultConfig: { label: "Input Field", type: "text", placeholder: "Enter value", name: "inputField" }
  },
  textarea_field: { 
    id: "textarea_field", 
    label: "Form Textarea", 
    icon: Edit3, 
    description: "For multi-line text input areas.",
    defaultConfig: { label: "Textarea", placeholder: "Enter text", name: "textareaField" }
  },
  map_embed: { 
    id: "map_embed", 
    label: "Map Embed", 
    icon: MapPin, 
    description: "Embed maps (e.g., Google Maps).",
    defaultConfig: { provider: "google", embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521106361757!2d106.8166656147691!3d-6.194420095514903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2c6eff0b6c2e6d!2sNational%20Monument!5e0!3m2!1sen!2sid!4v1620987473405!5m2!1sen!2sid", height: "400px" }
  },
  customCode: { 
    id: "customCode", 
    label: "Custom Code", 
    icon: Code2, 
    description: "Embed HTML, CSS, or JS snippets.",
    defaultConfig: { html: "<div>Your custom HTML here</div>" }
  },
};

export const getRegisteredComponents = (): ComponentConfig[] => {
  return Object.values(componentRegistry);
};

export const getComponentConfig = (type: string): ComponentConfig | undefined => {
  return componentRegistry[type];
};
