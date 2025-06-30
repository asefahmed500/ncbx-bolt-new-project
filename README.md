# NCBX

NCBX is a full-featured, no-code website builder that empowers users to create professional, responsive websites using an intuitive drag-and-drop editor. It comes packed with AI-powered content generation, a robust template system, and a complete admin panel for platform management.

## ✨ Core Features

-   **Visual Drag-and-Drop Editor**: Build pages by dragging components onto a canvas. Reorder and nest elements with ease.
-   **AI-Powered Content Generation**: Leverage Genkit to generate compelling website copy for various sections.
-   **Component-Based Architecture**: A rich library of pre-built components (Navbars, Heroes, Cards, Footers, etc.).
-   **Template System**: Start from pre-made templates, or save your own designs for reuse. Includes an admin approval workflow for public templates.
-   **User & Subscription Management**: Secure authentication via NextAuth.js and subscription handling with Stripe.
-   **Comprehensive Admin Panel**: Manage users, templates, coupons, and content moderation from a central dashboard.
-   **Dynamic Site Rendering**: Published websites are rendered dynamically based on their subdomain or custom domain.

## 🛠️ Tech Stack

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with ShadCN UI components
-   **Authentication**: NextAuth.js (Credentials Provider)
-   **Database**: MongoDB with Mongoose
-   **AI**: Google AI via Genkit
-   **Drag & Drop**: `@dnd-kit`
-   **Payments**: Stripe
-   **Asset Management**: Cloudinary (for image uploads)

---

## 🚀 Getting Started (For Developers)

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A MongoDB database instance (e.g., from [MongoDB Atlas](https://www.mongodb.com/atlas))
-   A [Stripe](https://stripe.com/) account for payment processing.
-   A [Cloudinary](https://cloudinary.com/) account for image uploads.
-   A [Google AI (Gemini)](https://ai.google.dev/) API Key for AI features.

### 1. Clone the Repository

```bash
git clone https://github.com/asefahmed500/ncbx-bolt-new-project
cd ncbx-canvas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the placeholder values with your actual credentials and keys. This is a critical step.

-   **`MONGODB_URI`**: Your full MongoDB connection string. **IMPORTANT**: Make sure to replace `YOUR_DB_NAME` in the URI with your actual database name.
-   **`NEXTAUTH_SECRET`**: A secret key for session encryption. Generate one with `openssl rand -base64 32`.
-   **`NEXTAUTH_URL`**: The full URL of your application. For local development, this should be `http://localhost:9003`.
-   **`APP_URL`**: Same as `NEXTAUTH_URL`.
-   **`NEXT_PUBLIC_APP_BASE_DOMAIN`**: The base domain for subdomains. For local testing, you can use a fake domain like `notthedomain.com`.
-   **`STRIPE_SECRET_KEY`**: Your Stripe secret key (e.g., `sk_test_...`).
-   **`STRIPE_WEBHOOK_SECRET`**: Your Stripe webhook signing secret (e.g., `whsec_...`).
-   **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**: Your Stripe publishable key (e.g., `pk_test_...`).
-   **`NEXT_PUBLIC_STRIPE_PRICE_ID_*`**: The Stripe Price IDs for your subscription plans. You need to create these products in your Stripe dashboard first.
-   **`CLOUDINARY_*`**: Your Cloudinary cloud name, API key, and secret for image uploading.
-   **`GEMINI_API_KEY`**: Your API key from Google AI Studio for AI features.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:9003`.

---

## 📖 User & Admin Documentation

### For Regular Users

#### **1. Registration & Dashboard**
-   **Sign Up**: Create an account using your name, email, and password.
-   **Dashboard**: After logging in, you'll land on your dashboard. This is your central hub to create new websites or manage existing ones.

#### **2. The Website Editor**
The editor is composed of three main parts:
-   **Component Library (Left Sidebar)**: A list of all available components (Headings, Buttons, Sections, etc.) that you can drag onto the canvas.
-   **Canvas (Center)**: The visual representation of your web page. Drag components here to build your layout.
-   **Property Inspector (Right Sidebar)**: When you select a component on the canvas, its properties (text, color, links, etc.) appear here for you to edit.

#### **3. Building a Website**
-   **Create a Site**: From the dashboard, click "Create New Website". Give it a name and an optional subdomain.
-   **Add Components**: Drag components from the left sidebar onto the canvas.
-   **Reorder Components**: Drag and drop components already on the canvas to change their order.
-   **Edit Content**: Click on a component on the canvas. Its settings will appear in the right-hand inspector. You can change text, colors, image URLs, links, and other properties.
-   **Manage Pages**: Use the tabs at the top of the canvas to switch between pages, add new pages, or delete existing ones.
-   **Save & Publish**:
    -   **Save**: Regularly save your progress. This creates a new version but doesn't make it live.
    -   **Publish**: When you're ready, hit "Publish" to make your latest saved version accessible to the world at its subdomain or custom domain.

#### **4. Managing Your Subscription**
-   Upgrade to a Pro plan to unlock more features, like creating more websites and using custom domains.
-   Manage your billing details, view invoices, or cancel your subscription at any time through the Stripe customer portal, accessible from your dashboard.

---

### For Administrators

#### **1. Accessing the Admin Panel**
-   To become an admin, you must manually change your user's `role` from "user" to "admin" in the MongoDB database.
-   Once you are an admin, a link to the "Admin Panel" will appear in your user dropdown menu, or you can navigate directly to `/admin/dashboard`.

#### **2. Admin Features**
-   **User Management**:
    -   Search for users by name or email.
    -   View detailed user information, including their subscription status.
    -   Suspend or reactivate user accounts.
-   **Template Management**:
    -   Review templates submitted by other users.
    -   Approve or reject submissions. Approved templates will appear in the public gallery for all users.
    -   Edit template metadata (name, category, price, etc.).
    -   Export template data as JSON.
-   **Coupon Management**:
    -   Create new discount coupons (percentage or fixed amount).
    -   Set usage limits, expiration dates, and minimum purchase amounts.
    -   View, edit, or delete existing coupons.
-   **Content Moderation**:
    -   Review user-generated content that has been flagged (e.g., template reviews).
    -   Approve or reject content to control what's visible on the platform.

---

## 📜 Available Scripts

-   `npm run dev`: Starts the Next.js development server with Turbopack.
-   `npm run genkit:dev`: Starts the Genkit AI development server.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints and formats the codebase.
