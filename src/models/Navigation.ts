
import mongoose, { Schema, model, models, type Document } from 'mongoose';

// Interface for a single link/item within a navigation menu
export interface INavigationItem {
  _id?: mongoose.Types.ObjectId; // Mongoose adds this by default
  label: string;
  url: string;
  type: 'internal' | 'external';
  // Potentially add icon, sub-items for dropdowns in the future
}

// Schema for a single navigation item (to be embedded)
const NavigationItemSchema = new Schema<INavigationItem>({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  type: { type: String, enum: ['internal', 'external'], default: 'internal' },
});


// Interface for the main Navigation entity
export interface INavigation extends Document {
  name: string;
  websiteId: mongoose.Schema.Types.ObjectId; // Link to the website it belongs to
  items: INavigationItem[]; // Array of navigation links
  createdAt: Date;
  updatedAt: Date;
}

const NavigationSchema = new Schema<INavigation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
    },
    items: [NavigationItemSchema],
  },
  {
    timestamps: true,
  }
);

// Index to efficiently query navigations by website
NavigationSchema.index({ websiteId: 1 });
// Index to prevent duplicate navigation names within the same website
NavigationSchema.index({ websiteId: 1, name: 1 }, { unique: true });


const Navigation = models.Navigation || model<INavigation>('Navigation', NavigationSchema);

export default Navigation;
