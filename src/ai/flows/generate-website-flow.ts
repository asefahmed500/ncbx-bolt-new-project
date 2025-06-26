
'use server';
/**
 * @fileOverview An AI agent that generates a multi-page website structure from a text prompt.
 *
 * - generateWebsiteFromPrompt - A function that handles the website generation process.
 * - GenerateWebsiteFromPromptInput - The input type for the function.
 * - GenerateWebsiteFromPromptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {componentRegistry} from '@/components/editor/componentRegistry';

// Define Zod schemas that mirror the Mongoose models for type-safe AI output.
const PageComponentConfigSchema_Zod = z.record(z.any()).describe('A flexible object for component configuration. For images, use `src` for the URL and `dataAiHint` for a 1-2 word hint for image search. For text, use `text` or `htmlContent`.');

const PageComponentSchema_Zod = z.object({
  type: z.string().describe('The type of the component to render.'),
  config: PageComponentConfigSchema_Zod,
  order: z.number().describe('The vertical order of the component on the page.'),
});

const PageSchema_Zod = z.object({
  name: z.string().describe('The name of the page, e.g., "Home", "About Us".'),
  slug: z.string().describe('The URL slug for the page, e.g., "/", "/about". The homepage must have a slug of "/".'),
  elements: z.array(PageComponentSchema_Zod).describe('The list of components that make up this page.'),
  seoTitle: z.string().optional().describe('The SEO title for the page.'),
  seoDescription: z.string().optional().describe('The SEO description for the page.'),
});

// Input and Output types for the flow
const GenerateWebsiteFromPromptInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the website, e.g., "a modern portfolio for a photographer named Jane Doe".'),
});
export type GenerateWebsiteFromPromptInput = z.infer<typeof GenerateWebsiteFromPromptInputSchema>;

const GenerateWebsiteFromPromptOutputSchema = z.object({
  pages: z.array(PageSchema_Zod).describe('An array of pages that constitute the website.'),
});
export type GenerateWebsiteFromPromptOutput = z.infer<typeof GenerateWebsiteFromPromptOutputSchema>;


// The exported function that client-side code will call.
export async function generateWebsiteFromPrompt(input: GenerateWebsiteFromPromptInput): Promise<GenerateWebsiteFromPromptOutput> {
  return generateWebsiteFlow(input);
}


// Dynamically get the list of available component types from the registry
const availableComponentTypes = Object.keys(componentRegistry).join(', ');

// Define the Genkit Prompt
const generateWebsitePrompt = ai.definePrompt({
  name: 'generateWebsitePrompt',
  input: {schema: GenerateWebsiteFromPromptInputSchema},
  output: {schema: GenerateWebsiteFromPromptOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert web designer and developer. A user wants to create a website. Your task is to generate the complete page structure for this website in JSON format based on the user's prompt.

The user's request is: "{{{prompt}}}"

You must create a structure with at least a Home page, and likely an About and Contact page unless the prompt implies otherwise. The homepage MUST have the slug of "/". Create a rich and complete website with multiple sections on each page. Use a variety of components to make the site engaging.

For each page, you will create a list of components ("elements"). You must choose components from the following available types:
[${availableComponentTypes}]

For each component, provide a 'type', 'order', and a 'config' object.
- The 'order' should be sequential starting from 0 for each page.
- The 'config' object should contain appropriate and creative placeholder content based on the user's prompt.
- For text properties (like 'text', 'title', 'subtitle', 'htmlContent'), generate creative and relevant placeholder text.
- For image 'src' properties, you MUST use placeholder URLs from "https://placehold.co". For example: "https://placehold.co/1200x600.png" for a hero background or "https://placehold.co/400x300.png" for a card image.
- For every placeholder image you use, you MUST also add a "dataAiHint" property to its config object with one or two keywords that describe the desired image (e.g., { "src": "...", "dataAiHint": "bakery interior" }).

Here is an example for a simple "About Us" page component structure:
"elements": [
  {
    "type": "navbar",
    "order": 0,
    "config": { "brandText": "Jane's Bakery" }
  },
  {
    "type": "heading",
    "order": 1,
    "config": { "text": "About Jane's Bakery", "level": "h1" }
  },
  {
    "type": "text",
    "order": 2,
    "config": { "htmlContent": "<p>We started with a passion for baking...</p>" }
  }
]

Generate the full JSON output for the 'pages' array now. Be creative and generate a comprehensive multi-page site structure.
`,
});

// Define the Genkit Flow
const generateWebsiteFlow = ai.defineFlow(
  {
    name: 'generateWebsiteFlow',
    inputSchema: GenerateWebsiteFromPromptInputSchema,
    outputSchema: GenerateWebsiteFromPromptOutputSchema,
  },
  async input => {
    const {output} = await generateWebsitePrompt(input);
    if (!output) {
      throw new Error("AI failed to generate website structure.");
    }
    // Ensure at least one page exists and one is a homepage
    if (output.pages.length === 0) {
        output.pages.push({ name: "Home", slug: "/", elements: [], seoTitle: "Home", seoDescription: "" });
    }
    if (!output.pages.some(p => p.slug === "/")) {
        output.pages[0].slug = "/";
        output.pages[0].name = "Home";
    }
    return output;
  }
);

    