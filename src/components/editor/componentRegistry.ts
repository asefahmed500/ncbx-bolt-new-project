
import {
  Type,
  ImageIcon,
  Square as ButtonIconElement,
  Box,
  Columns,
  Heading1,
  Minus,
  Code2,
  Video,
  MapPin,
  PanelTop, 
  AppWindow, 
  PanelBottom, 
  LayoutGrid as CardSectionIcon,
  Sparkles, 
  MessageSquareText, 
  BadgeDollarSign, 
  HelpCircle,
  Images,
  TrendingUp,
  Megaphone, 
  Users, 
  Mail, 
  Newspaper, 
  Briefcase, 
  Info,
  RectangleHorizontal,
  PanelRight,
  GalleryThumbnails,
  EyeOff,
  UserPlus,
  MailQuestion
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';


// Helper function to generate a unique client-side ID.
const newObjectId = () => Math.random().toString(36).substring(2, 15);


export interface ComponentConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  isContainer?: boolean;
  defaultConfig?: Record<string, any>;
}

export const componentRegistry: Record<string, ComponentConfig> = {
  section: {
    id: "section",
    label: "Section",
    icon: Box,
    description: "Group content into distinct sections.",
    isContainer: true,
    defaultConfig: { id: newObjectId(), backgroundColor: "transparent", paddingTop: "60px", paddingBottom: "60px", elements: [] },
  },
   columns: {
    id: "columns",
    label: "Columns Layout",
    icon: Columns,
    description: "Arrange content in responsive columns.",
    isContainer: true,
    defaultConfig: { 
      count: 2, 
      gap: "1rem", 
      columns: [
        { id: newObjectId(), elements: [] },
        { id: newObjectId(), elements: [] }
      ]
    },
  },
  heading: {
    id: "heading",
    label: "Heading",
    icon: Heading1,
    description: "For titles and subheadings (H1-H6).",
    defaultConfig: { text: "New Heading", level: "h2", color: "#111827", fontSize: "3rem", alignment: "left" },
  },
  text: {
    id: "text",
    label: "Rich Text",
    icon: Type,
    description: "Paragraphs, lists, and formatted text.",
    defaultConfig: { htmlContent: "<p>Start writing your content here. Use this for paragraphs, lists, and other text formatting.</p>", alignment: "left" },
  },
  image: {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    description: "Embed single images.",
    defaultConfig: { src: "https://placehold.co/600x400.png", alt: "Placeholder Image", width: 600, height: 400, dataAiHint: "placeholder" },
  },
  button: {
    id: "button",
    label: "Button",
    icon: ButtonIconElement,
    description: "Interactive call-to-action links.",
    defaultConfig: { text: "Click Me", link: "#", style: "primary", alignment: "left", icon: null, iconPosition: "left" },
  },
   divider: {
    id: "divider",
    label: "Divider",
    icon: Minus,
    description: "A visual horizontal separator.",
    defaultConfig: { style: "solid", color: "#e5e7eb", height: "1px", marginY: "2rem" },
  },
  spacer: {
    id: "spacer",
    label: "Spacer",
    icon: RectangleHorizontal,
    description: "Adds vertical empty space.",
    defaultConfig: { height: "4rem" },
  },
  navbar: {
    id: "navbar",
    label: "Navbar",
    icon: PanelTop,
    description: "Responsive top navigation bar.",
    defaultConfig: {
      brandText: "MySite",
      brandLink: "/", 
      navigationId: null, 
      links: [{ text: "Home", href: "/", type: "internal" }, { text: "About", href: "/about", type: "internal" }],
      backgroundColor: "transparent", 
      textColor: "#374151"
    },
  },
  hero: {
    id: "hero",
    label: "Hero Section",
    icon: AppWindow,
    description: "Large intro section with heading + CTA.",
    defaultConfig: {
      title: "Welcome to Our Site!",
      subtitle: "Amazing things happen here.",
      buttonText: "Learn More",
      buttonLink: "#",
      backgroundImage: "https://placehold.co/1200x600.png",
      dataAiHint: "abstract background",
      backgroundColor: "#f9fafb", // A light gray
      textColor: "#111827", // Dark text
      textAlign: "center"
    },
  },
  footer: {
    id: "footer",
    label: "Footer",
    icon: PanelBottom,
    description: "Site footer with links and copyright.",
    defaultConfig: {
      copyrightText: `© ${new Date().getFullYear()} MySite. All rights reserved.`,
      links: [{ text: "Privacy", href: "/privacy" }, { text: "Terms", href: "/terms" }],
      socialLinks: [ { platform: "twitter", href: "#"}, { platform: "facebook", href: "#"}],
      backgroundColor: "#1f2937", // Dark Gray
      textColor: "#d1d5db" // Light Gray text
    },
  },
  card_section: {
    id: "card_section",
    label: "Card Section",
    icon: CardSectionIcon,
    description: "Display content in a series of cards.",
    defaultConfig: {
      title: "Featured Content",
      cards: [
        { title: "Card 1", description: "Description for card 1", image: "https://placehold.co/300x200.png", dataAiHint: "feature item", link: "#" },
        { title: "Card 2", description: "Description for card 2", image: "https://placehold.co/300x200.png", dataAiHint: "product service", link: "#" },
        { title: "Card 3", description: "Description for card 3", image: "https://placehold.co/300x200.png", dataAiHint: "information block", link: "#" },
      ],
      backgroundColor: "#f9fafb",
      textColor: "#1f2937",
    },
  },
  features: {
    id: "features",
    label: "Features",
    icon: Sparkles,
    description: "Grid/list of features with icons.",
    defaultConfig: {
      title: "Our Amazing Features",
      items: [
        { title: "Feature One", description: "Description of feature one.", icon: "Zap" },
        { title: "Feature Two", description: "Description of feature two.", icon: "ShieldCheck" },
        { title: "Feature Three", description: "Description of feature three.", icon: "ThumbsUp" },
      ]
    },
  },
   contact_form: {
    id: "contact_form",
    label: "Contact Form",
    icon: MailQuestion,
    description: "A complete contact form section.",
    defaultConfig: { title: "Get In Touch", recipientEmail: "contact@example.com", submitButtonText: "Send Message" }
  },
  tabs: {
    id: "tabs",
    label: "Tabs Section",
    icon: PanelRight,
    description: "Organize content into tabs.",
    defaultConfig: {
      items: [
        { title: "Tab 1", content: "<p>Content for Tab 1</p>" },
        { title: "Tab 2", content: "<p>Content for Tab 2</p>" }
      ]
    },
  },
  slider: {
    id: "slider",
    label: "Image Slider",
    icon: GalleryThumbnails,
    description: "A carousel for images.",
    defaultConfig: {
      images: [
        { src: "https://placehold.co/800x400.png", dataAiHint: "slide show one" },
        { src: "https://placehold.co/800x400.png", dataAiHint: "slide show two" }
      ]
    },
  },
  testimonials: {
    id: "testimonials",
    label: "Testimonials",
    icon: MessageSquareText,
    description: "Customer testimonials.",
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
    label: "Pricing Table",
    icon: BadgeDollarSign,
    description: "Display pricing plans.",
    defaultConfig: {
      title: "Our Plans",
      plans: [
        { name: "Basic", price: 1000, period: "mo", features: ["Feature A", "Feature B", "Limited Support"], buttonText: "Choose Basic", buttonLink: "#", isPopular: false },
        { name: "Pro", price: 2500, period: "mo", features: ["All Basic Features", "Feature C", "Feature D", "Priority Support"], buttonText: "Choose Pro", buttonLink: "#", isPopular: true },
        { name: "Enterprise", price: -1, period: "mo", features: ["All Pro Features", "Dedicated Support", "Custom Integrations"], buttonText: "Contact Us", buttonLink: "#", isPopular: false },
      ]
    },
  },
  faq: {
    id: "faq",
    label: "FAQ (Accordion)",
    icon: HelpCircle,
    description: "Collapsible FAQ section.",
    defaultConfig: {
      title: "Frequently Asked Questions",
      items: [
        { question: "What is this?", answer: "This is an answer." },
        { question: "How does it work?", answer: "It works like magic." },
      ]
    },
  },
  video_embed: {
    id: "video_embed",
    label: "Video Embed",
    icon: Video,
    description: "Responsive video embed section.",
    defaultConfig: { provider: "youtube", url: "dQw4w9WgXcQ", aspectRatio: "16:9" },
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
    defaultConfig: { html: "<div>\\n  <!-- Your custom HTML code here -->\\n  <p>This is a custom code block.</p>\\n</div>" }
  },
  locked_content: {
    id: "locked_content",
    label: "Premium Content",
    icon: EyeOff,
    description: "Content visible only to premium users.",
    defaultConfig: {
      upgradeMessage: "Upgrade to Pro to view this content",
      elements: []
    }
  },
  login_signup: {
    id: "login_signup",
    label: "Login/Signup Section",
    icon: UserPlus,
    description: "A section prompting users to log in or register.",
    defaultConfig: {
      title: "Join Our Community",
      description: "Sign up to get access to exclusive content and features.",
      loginButtonText: "Login",
      signupButtonText: "Sign Up Free",
    }
  },
   call_to_action: {
    id: "call_to_action",
    label: "Call to Action",
    icon: Megaphone,
    description: "A simple section with text and a button.",
    defaultConfig: { text: "Ready to get started?", buttonText: "Contact Us", buttonLink: "/contact" }
  },
  stats: {
    id: "stats",
    label: "Stats Section",
    icon: TrendingUp,
    description: "Showcase key numbers and metrics.",
    defaultConfig: { items: [ { value: "1M+", label: "Users" }, { value: "99%", label: "Satisfaction" } ] }
  },
  team: {
    id: "team",
    label: "Team Section",
    icon: Users,
    description: "Introduce your team members.",
    defaultConfig: { title: "Meet Our Team", members: [ { name: "Jane Doe", role: "CEO", image: "https://placehold.co/200x200.png", dataAiHint:"ceo person" } ] }
  },
  newsletter_signup: {
    id: "newsletter_signup",
    label: "Newsletter Signup",
    icon: Mail,
    description: "A form to collect email subscribers.",
    defaultConfig: { title: "Subscribe", placeholder: "Enter your email", buttonText: "Join" }
  },
  blog_posts: {
    id: "blog_posts",
    label: "Blog Posts",
    icon: Newspaper,
    description: "A list or grid of recent blog posts.",
    defaultConfig: { title: "From Our Blog", posts: [ { title: "First Post", excerpt: "This is an excerpt." } ] }
  },
  services_list: {
    id: "services_list",
    label: "Services List",
    icon: Briefcase,
    description: "Detail the services you offer.",
    defaultConfig: { title: "Our Services", items: [ { name: "Service One", description: "Description of service." } ] }
  },
  about_section: {
    id: "about_section",
    label: "About Section",
    icon: Info,
    description: "A section with text and an optional image.",
    defaultConfig: { title: "About Us", content: "<p>Learn more about our company...</p>", imageUrl: "https://placehold.co/500x350.png", dataAiHint:"company team" }
  },
};

export const getRegisteredComponents = (): ComponentConfig[] => {
  return Object.values(componentRegistry);
};

export const getComponentConfig = (type: string): ComponentConfig | undefined => {
  return componentRegistry[type];
};
