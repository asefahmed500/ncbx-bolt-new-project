
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
  AppWindow, // For Hero Section
  PanelBottom, // For Footer
  LayoutGrid as CardSectionIcon, // Renamed to avoid conflict
  Sparkles, // Features
  MessageSquareText, // Testimonials
  BadgeDollarSign, // Pricing
  MailQuestion, // Contact Form
  HelpCircle, // FAQ
  Images, // Gallery
  TrendingUp, // Stats
  Megaphone, // CallToAction
  Users, // Team
  Mail, // Newsletter
  Newspaper, // Blog
  Briefcase, // Services
  Info, // About
} from "lucide-react";

export interface ComponentConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultConfig?: Record<string, any>;
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
    label: "Navbar Section",
    icon: PanelTop,
    description: "Responsive top navigation bar.",
    defaultConfig: {
      brandText: "MySite",
      brandLink: "/", // Added brandLink
      navigationId: null, // To store ID of a global Navigation entity
      links: [{ text: "Home", href: "/", type: "internal" }, { text: "About", href: "/about", type: "internal" }],
      backgroundColor: "bg-neutral-100", textColor: "text-neutral-800"
    },
  },
  hero: {
    id: "hero",
    label: "Hero Section",
    icon: AppWindow,
    description: "Large hero section with heading + CTA.",
    defaultConfig: {
      title: "Welcome to Our Site!",
      subtitle: "Amazing things happen here.",
      buttonText: "Learn More",
      buttonLink: "#",
      backgroundImage: "https://placehold.co/1200x600.png",
      dataAiHint: "abstract background",
      backgroundColor: "bg-primary/10", textColor: "text-neutral-800", textAlign: "text-center"
    },
  },
  card_section: {
    id: "card_section",
    label: "Card Section",
    icon: CardSectionIcon,
    description: "Display content in a series of cards.",
    defaultConfig: {
      title: "Featured Cards",
      cards: [
        { title: "Card 1", description: "Description for card 1", image: "https://placehold.co/300x200.png", dataAiHint: "feature item", link: "#" },
        { title: "Card 2", description: "Description for card 2", image: "https://placehold.co/300x200.png", dataAiHint: "product service", link: "#" },
        { title: "Card 3", description: "Description for card 3", image: "https://placehold.co/300x200.png", dataAiHint: "information block", link: "#" },
      ],
      backgroundColor: "bg-muted/30",
      textColor: "text-neutral-800",
    },
  },
  footer: {
    id: "footer",
    label: "Footer Section",
    icon: PanelBottom,
    description: "Responsive footer with links/socials.",
    defaultConfig: {
      copyrightText: `© ${new Date().getFullYear()} MySite. All rights reserved.`,
      links: [{ text: "Privacy", href: "/privacy" }, { text: "Terms", href: "/terms" }],
      socialLinks: [ { platform: "twitter", href: "#"}, { platform: "facebook", href: "#"}],
      backgroundColor: "bg-neutral-800", textColor: "text-neutral-300"
    },
  },
  features: {
    id: "features",
    label: "Features Section",
    icon: Sparkles,
    description: "Grid/list of features.",
    defaultConfig: {
      title: "Our Amazing Features",
      items: [
        { title: "Feature One", description: "Description of feature one.", icon: "Zap" },
        { title: "Feature Two", description: "Description of feature two.", icon: "ShieldCheck" },
        { title: "Feature Three", description: "Description of feature three.", icon: "ThumbsUp" },
      ]
    },
  },
  testimonials: {
    id: "testimonials",
    label: "Testimonials Section",
    icon: MessageSquareText,
    description: "Customer testimonials with avatars.",
    defaultConfig: {
      title: "What Our Users Say",
      items: [
        { quote: "This is fantastic!", author: "Jane Doe", avatar: "https://placehold.co/100x100.png", dataAiHint:"person avatar" },
        { quote: "Highly recommend!", author: "John Smith", avatar: "https://placehold.co/100x100.png", dataAiHint:"person avatar" },
      ]
    },
  },
  pricing_table: {
    id: "pricing_table",
    label: "Pricing Table/Cards",
    icon: BadgeDollarSign,
    description: "Pricing table or cards.",
    defaultConfig: {
      title: "Our Plans",
      plans: [
        { name: "Basic", price: "$10/mo", features: ["Feature A", "Feature B"] },
        { name: "Pro", price: "$20/mo", features: ["Feature A", "Feature B", "Feature C"] },
      ]
    },
  },
  contact_form: {
    id: "contact_form",
    label: "Contact Form Section",
    icon: MailQuestion,
    description: "Responsive contact form.",
    defaultConfig: { title: "Get In Touch", recipientEmail: "contact@example.com" }
  },
  faq: {
    id: "faq",
    label: "FAQ Section",
    icon: HelpCircle,
    description: "Accordion or collapsible FAQ section.",
    defaultConfig: {
      title: "Frequently Asked Questions",
      items: [
        { question: "What is this?", answer: "This is an answer." },
        { question: "How does it work?", answer: "It works like magic." },
      ]
    },
  },
  gallery: {
    id: "gallery",
    label: "Image Gallery",
    icon: Images,
    description: "Image gallery with lightbox or grid.",
    defaultConfig: {
      title: "Our Gallery",
      images: [
        { src: "https://placehold.co/400x300.png?text=Image+1", alt: "Image 1", dataAiHint:"landscape" },
        { src: "https://placehold.co/400x300.png?text=Image+2", alt: "Image 2", dataAiHint:"cityscape" },
      ]
    },
  },
  stats: {
    id: "stats",
    label: "Stats Section",
    icon: TrendingUp,
    description: "Stats or counters with icons.",
    defaultConfig: {
      title: "Our Achievements",
      items: [
        { value: "100+", label: "Projects Done", icon: "Briefcase" },
        { value: "50+", label: "Happy Clients", icon: "Users" },
      ]
    },
  },
  call_to_action: {
    id: "call_to_action",
    label: "Call To Action Banner",
    icon: Megaphone,
    description: "Call to action banner.",
    defaultConfig: { text: "Ready to Get Started?", buttonText: "Sign Up Now", buttonLink: "/register" }
  },
  team: {
    id: "team",
    label: "Team Section",
    icon: Users,
    description: "Team member cards.",
    defaultConfig: {
      title: "Meet Our Team",
      members: [
        { name: "Alice", role: "CEO", image: "https://placehold.co/200x200.png?text=Alice", dataAiHint:"person" },
        { name: "Bob", role: "CTO", image: "https://placehold.co/200x200.png?text=Bob", dataAiHint:"person" },
      ]
    },
  },
  newsletter_signup: {
    id: "newsletter_signup",
    label: "Newsletter Signup",
    icon: Mail,
    description: "Email signup form section.",
    defaultConfig: { title: "Subscribe to Our Newsletter", placeholder: "Enter your email" }
  },
  video_embed: {
    id: "video_embed",
    label: "Video Embed",
    icon: Video,
    description: "Responsive video embed section.",
    defaultConfig: { provider: "youtube", url: "VIDEO_ID_HERE", aspectRatio: "16:9" },
  },
  blog_posts: {
    id: "blog_posts",
    label: "Blog Posts Preview",
    icon: Newspaper,
    description: "Blog post previews or cards.",
    defaultConfig: {
      title: "Latest Articles",
      count: 3,
      showFeaturedImage: true
    }
  },
  services_list: {
    id: "services_list",
    label: "Services List",
    icon: Briefcase,
    description: "List of services with icons.",
    defaultConfig: {
      title: "Our Services",
      items: [
        { name: "Web Design", description: "Creative web design.", icon: "Layout" },
        { name: "Development", description: "Full-stack development.", icon: "Code" },
      ]
    }
  },
  about_section: {
    id: "about_section",
    label: "About Section",
    icon: Info,
    description: "Company/about info section.",
    defaultConfig: { title: "About Us", content: "<p>We are a team dedicated to excellence.</p>", elements: [] }
  },
  section: {
    id: "section",
    label: "Section / Container",
    icon: Box,
    description: "Group content into distinct sections.",
    defaultConfig: { backgroundColor: "#FFFFFF", paddingTop: "20px", paddingBottom: "20px", elements: [] },
  },
  columns: {
    id: "columns",
    label: "Columns Layout",
    icon: Columns,
    description: "Arrange content in responsive columns.",
    defaultConfig: { count: 2, gap: "16px", layout: ["1fr", "1fr"], elements: [[],[]] }, // elements per column
  },
  divider: {
    id: "divider",
    label: "Divider",
    icon: Minus,
    description: "Add a visual horizontal separator.",
    defaultConfig: { style: "solid", color: "#cccccc", height: "1px", marginY: "16px" },
  },
  form: {
    id: "form",
    label: "Form Container",
    icon: ListChecks,
    description: "Group form input fields for submissions.",
    defaultConfig: { submitUrl: "/api/submit-form", buttonText: "Submit", elements: [] }
  },
  input: {
    id: "input",
    label: "Form Input Field",
    icon: Edit3, // Reusing Edit3 as a generic input icon
    description: "For text, email, number, etc. inputs.",
    defaultConfig: { label: "Input Field", type: "text", placeholder: "Enter value", name: "inputField" }
  },
  textarea_field: { // Renamed from just 'textarea' to avoid conflict with HTML tag
    id: "textarea_field",
    label: "Form Textarea",
    icon: Edit3, // Reusing Edit3
    description: "For multi-line text input areas.",
    defaultConfig: { label: "Textarea", placeholder: "Enter text", name: "textareaField" }
  },
  map_embed: {
    id: "map_embed",
    label: "Map Embed",
    icon: MapPin,
    description: "Embed maps (e.g., Google Maps).",
    defaultConfig: { provider: "google", embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521106361757!2d106.8166656147691!3d-6.194420095514903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2c6eff0b6c2e6d!2sNational%20Monument!5e0!3m2!1sen!2sid!4v1620987473405!5m2!1sen!2sid!4v1620987473405!5m2!1sen!2sid", height: "400px" }
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

```