
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
        'text',          // Config: { htmlContent: "<p>Hello</p>", alignment: "left", color: "#333", fontFamily: "Inter", fontSize: "16px" }
        'heading',       // Config: { level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", text: "My Title", color: "#111", fontFamily: "Poppins", fontSize: "32px", alignment: "center" }
        'image',         // Config: { src: "url", alt: "description", width: "100%", height: "auto", link: "optional_url", openInNewTab: true, caption: "Optional caption", cornerRadius: "8px", shadow: "md" }
        'button',        // Config: { text: "Click Me", link: "url", style: "primary" | "secondary" | "outline", size: "md" | "sm" | "lg", backgroundColor: "#007bff", textColor: "#ffffff", hoverBackgroundColor: "#0056b3", cornerRadius: "4px", iconLeft: "lucide-icon-name", iconRight: "lucide-icon-name" }
        'section',       // Config: { backgroundColor: "#f0f0f0", backgroundImage: "url", backgroundSize: "cover", paddingTop: "20px", paddingBottom: "20px", fullWidth: false, minHeight: "300px", verticalAlignment: "center" }
        'columns',       // Config: { count: 2, gap: "16px", layout: ["1fr", "1fr"] or ["30%", "70%"], verticalAlignment: ["top", "center"] } (each column then holds more PageComponents)
        'divider',       // Config: { style: "solid" | "dashed" | "dotted", color: "#ccc", height: "1px", marginY: "16px", width: "100%" }
        'customCode',    // Config: { html: "...", css: "...", js: "..." }
        'video',         // Config: { provider: "youtube" | "vimeo" | "self", url: "video_url_or_id", autoplay: false, controls: true, loop: false, aspectRatio: "16:9" }
        'form',          // Config: { submitUrl: "/api/submit-form", successMessage: "Thanks for your submission!", errorMessage: "Submission failed.", buttonText: "Submit Now" } (would contain 'input', 'textarea_field' components as children)
        'input',         // Config: { label: "Name", type: "text" | "email" | "tel" | "number" | "password" | "date", placeholder: "Your Name", required: true, name: "userName", defaultValue: "", helpText: "Enter your full name." }
        'textarea_field',// Config: { label: "Message", placeholder: "Your Message", required: false, rows: 4, name: "userMessage", defaultValue: "", helpText: "Max 500 characters." }
        'map_embed',     // Config: { provider: "google", embedUrl: "google_maps_embed_url", height: "400px", zoomLevel: 15 } // or address + API key for dynamic map
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
