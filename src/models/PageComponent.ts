import mongoose, { Schema, type Document } from 'mongoose';

// This schema is intended to be EMBEDDED within the Page schema.
// It does not need to be registered as a separate model unless used independently.

export interface IPageComponent extends Document {
  type: string; // e.g., 'text', 'image', 'button', 'section', 'columns', 'divider', 'heading'
  config: mongoose.Schema.Types.Mixed; // Flexible object to store component-specific data and content
  // Example config for a 'text' component: { text: "Hello World", alignment: "left", fontSize: "16px" }
  // Example config for an 'image' component: { src: "https://placehold.co/600x400.png", alt: "Placeholder", dataAiHint: "abstract" }
  order: number; // For ordering components within a page or section
}

export const PageComponentSchema = new Schema<IPageComponent>(
  {
    type: {
      type: String,
      required: [true, 'Component type is required.'],
      enum: ['text', 'heading', 'image', 'button', 'section', 'columns', 'divider'], // Add more as needed
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
