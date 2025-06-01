
import mongoose, { Schema, type Document } from 'mongoose';

// This schema is intended to be EMBEDDED within the Page schema.
// It does not need to be registered as a separate model unless used independently.

export interface IPageComponent extends Document {
  type: string; // e.g., 'text', 'image', 'button', 'section', 'columns', 'divider', 'heading', 'customCode', 'video', 'form', 'input', 'textarea_field', 'map_embed'
  config: mongoose.Schema.Types.Mixed; // Flexible object to store component-specific data and content
  order: number; // For ordering components within a page or section
}

export const PageComponentSchema = new Schema<IPageComponent>(
  {
    type: {
      type: String,
      required: [true, 'Component type is required.'],
      enum: [
        'text',          // For rich text content. Config: { htmlContent: "<p>Hello</p>", alignment: "left" }
        'heading',       // For H1, H2, etc. Config: { level: "h1", text: "My Title", color: "#333" }
        'image',         // For single images. Config: { src: "url", alt: "description", width: "100%", link: "optional_url", openInNewTab: true, galleryId: "group_for_lightbox" }
                         // For image galleries/sliders, 'image' type could be used repeatedly within a 'section' with type 'gallery' or 'slider', or a dedicated 'gallery' component type.
        'button',        // For CTAs. Config: { text: "Click Me", link: "url", style: "primary", size: "md", hoverEffect: "darken" }
        'section',       // A container for other components. Config: { backgroundColor: "#f0f0f0", paddingTop: "20px", fullWidth: false, sticky: false }
        'columns',       // For multi-column layouts. Config: { count: 2, gap: "10px", layout: ["50%", "50%"] } (each column then holds more PageComponents)
        'divider',       // Visual separator. Config: { style: "solid", color: "#ccc", height: "1px", marginY: "10px" }
        'customCode',    // For HTML/CSS/JS. Config: { html: "...", css: "...", js: "..." }
        'video',         // For embedding videos. Config: { provider: "youtube" | "vimeo" | "self", url: "video_url_or_id", autoplay: false, controls: true }
        'form',          // Container for form elements. Config: { submitUrl: "/api/contact", successMessage: "Thanks!" } (would contain 'input', 'textarea_field' components)
        'input',       // For form input fields. Config: { label: "Name", type: "text" | "email" | "tel", placeholder: "Your Name", required: true, name: "userName" }
        'textarea_field',// For form text areas. Config: { label: "Message", placeholder: "Your Message", required: false, rows: 4, name: "userMessage" }
        'map_embed',       // For embedding maps. Config: { provider: "google", embedUrl: "google_maps_embed_url" } // or address + API key for dynamic map
                        // Complex features like 'Mega Menus', 'Accordions', 'Tabs', 'Modal Popups', 'Event Calendars', 'Booking Systems' would likely be their own component types
                        // or highly configurable 'section' components with specific internal structures.
      ],
    },
    config: {
      type: Schema.Types.Mixed,
      required: [true, 'Component configuration is required.'],
      default: {},
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true, timestamps: true } // Embedded documents get timestamps too
);

// If you ever need PageComponent as a standalone model (though typically embedded):
// import { model, models } from 'mongoose';
// const PageComponent = models.PageComponent || model<IPageComponent>('PageComponent', PageComponentSchema);
// export default PageComponent;
