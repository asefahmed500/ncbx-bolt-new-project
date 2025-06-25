
import mongoose, { Schema, type Document } from 'mongoose';

export interface IPageComponent extends Document {
  _id?: string | mongoose.Types.ObjectId;
  type: string;
  config: mongoose.Schema.Types.Mixed;
  order: number;
  label?: string; // For editor UI, if different from type
  createdAt?: Date;
  updatedAt?: Date;
}

export const PageComponentSchema = new Schema<IPageComponent>(
  {
    type: {
      type: String,
      required: [true, 'Component type is required.'],
      enum: [
        'heading', 'text', 'image', 'button', 'section', 'columns', 'divider',
        'customCode', 'video_embed', 'form', 'input', 'textarea_field', 'map_embed',
        'navbar', 'hero', 'footer', 'card_section', // Existing new ones
        'features', 'testimonials', 'pricing_table', 'contact_form', // From user list
        'faq', 'gallery', 'stats', 'call_to_action', 'team', // From user list
        'newsletter_signup', 'blog_posts', 'services_list', 'about_section' // From user list
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
    label: { // Optional label for editor UI
      type: String,
    }
  },
  { _id: true, timestamps: true }
);

// No need to register as a model if only embedded
