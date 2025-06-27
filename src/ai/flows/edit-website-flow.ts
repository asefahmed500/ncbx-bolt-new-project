
'use server';
/**
 * @fileOverview An AI agent that edits a website structure based on a user prompt.
 *
 * - editWebsite - A function that handles the website editing process.
 * - EditWebsiteInput - The input type for the function.
 * - EditWebsiteOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {componentRegistry} from '@/components/editor/componentRegistry';
import { applyTemplate } from '@/ai/tools/template-tools';

// Re-using schemas from the generation flow for consistency.
const PageComponentConfigSchema_Zod = z.object({
    text: z.string().optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
    htmlContent: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
}).passthrough().describe('A flexible object for component configuration.');

const PageComponentSchema_Zod = z.object({
  _id: z.string().optional().describe("A unique identifier for the component."),
  type: z.string().describe('The type of the component to render.'),
  config: PageComponentConfigSchema_Zod,
  order: z.number().describe('The vertical order of the component on the page.'),
});
const PageSchema_Zod = z.object({
  _id: z.string().optional().describe("A unique identifier for the page."),
  name: z.string().describe('The name of the page, e.g., "Home", "About Us".'),
  slug: z.string().describe('The URL slug for the page, e.g., "/", "/about".'),
  elements: z.array(PageComponentSchema_Zod).describe('The list of components that make up this page.'),
  seoTitle: z.string().optional().describe('The SEO title for the page.'),
  seoDescription: z.string().optional().describe('The SEO description for the page.'),
});

const GlobalSettingsSchema_Zod = z.object({
  siteName: z.string().optional().describe('The name of the entire website.'),
  fontFamily: z.string().optional().describe('The main body font for the website (e.g., "Inter", "Lato", "Merriweather").'),
  fontHeadline: z.string().optional().describe('The headline font for the website (e.g., "Poppins", "Playfair Display", "Oswald").'),
}).describe('Global style settings for the entire website.');


// Input and Output types for the flow
const EditWebsiteInputSchema = z.object({
  prompt: z.string().describe('The user\'s command for editing the website.'),
  currentPages: z.array(PageSchema_Zod).describe('The current JSON structure of all pages on the website.'),
  globalSettings: GlobalSettingsSchema_Zod.optional().describe('The current global settings of the website.'),
  activePageSlug: z.string().describe('The slug of the page currently being viewed by the user in the editor.'),
});
export type EditWebsiteInput = z.infer<typeof EditWebsiteInputSchema>;

const EditWebsiteOutputSchema = z.object({
  modifiedPages: z.array(PageSchema_Zod).describe('The complete, modified JSON structure of the pages.'),
  modifiedGlobalSettings: GlobalSettingsSchema_Zod.optional().describe('The complete, modified JSON structure for the global settings.'),
  explanation: z.string().describe('A brief, user-facing explanation of what changes were made.'),
});
export type EditWebsiteOutput = z.infer<typeof EditWebsiteOutputSchema>;

// The exported function that client-side code will call.
export async function editWebsite(input: EditWebsiteInput): Promise<EditWebsiteOutput> {
  return editWebsiteFlow(input);
}

const editWebsitePrompt = ai.definePrompt({
  name: 'editWebsitePrompt',
  tools: [applyTemplate],
  input: {schema: EditWebsiteInputSchema.extend({ componentExamples: z.any() })},
  output: {schema: EditWebsiteOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert web designer AI assistant integrated into a website builder.
Your task is to analyze the user's prompt and the current website structure (provided as 'currentPages' and 'globalSettings' JSON), and then return the complete, modified JSON structure that reflects the requested changes.

User's Prompt: "{{{prompt}}}"
Currently Active Page Slug: "{{{activePageSlug}}}"

Available Components and their default structures:
\`\`\`json
{{{jsonEncode componentExamples}}}
\`\`\`
A list of recommended Google Fonts: "Inter", "Poppins", "Roboto", "Lato", "Montserrat", "Oswald", "Raleway", "Merriweather", "Playfair Display".

Instructions:
1.  **Analyze the Request**: Understand if the user wants to add, delete, modify a component, change a style, add a page, or perform a general restructuring.
2.  **Handle Global Style Changes**: If the user asks to change a site-wide style like "change the font to Roboto", you MUST modify the 'globalSettings' object. Update 'fontFamily' for body text and 'fontHeadline' for headings. Do NOT attempt to change styles inside individual components for a global request.
3.  **Handle Page/Component Changes**: Most changes should be applied to the currently active page unless the user specifies otherwise (e.g., "add a contact page").
4.  **Handle Deletion**: If the user asks to remove or delete a component (e.g., "remove the hero section"), find that component within the \`currentPages\` JSON and remove it from its \`elements\` array.
5.  **Handle Template Application**: If the user asks to apply a template (e.g., "apply the 'Modern Blog' template"), you MUST use the \`applyTemplate\` tool with the provided template name. The tool will return a page structure. You MUST then replace the entire \`elements\` array of the \`activePageSlug\` with the \`elements\` from the *first page* of the returned template structure.
6.  **Return Modified Structure**: Your primary output is the 'modifiedPages' field and the 'modifiedGlobalSettings' field. You must return the *entire*, updated structure for both, even if one of them was not changed.
7.  **Explain Your Actions**: In the 'explanation' field, provide a short, friendly message to the user explaining what you did.
8.  **Be Smart**:
    - When adding a new component (e.g., "add a hero section"), use the default structure from the 'Available Components' list above as a starting point. Then, populate it with relevant placeholder content based on the user's prompt and the website's context.
    - For images, you MUST use placeholder URLs from "https://placehold.co" and add a "dataAiHint" property with keywords.
    - If changing a style on a specific component (e.g., "make the background dark blue"), find the relevant component (like a 'section' or 'hero') and update its 'backgroundColor' in the config. Use hex color codes.
    - If adding a new page (e.g., "create an 'About Us' page"), add a new page object to the 'pages' array with a suitable name and slug, and add some basic components to it.
    - **IMPORTANT**: When you add a new component or a new page, you must generate a new unique '_id' for it. An ID can be a short random string of letters and numbers.
9.  **If Unsure**: If the prompt is too vague or you cannot fulfill it, return the original, unmodified 'currentPages' and 'globalSettings' structures and use the 'explanation' field to ask for clarification.

Current Global Settings JSON:
\`\`\`json
{{{jsonEncode globalSettings}}}
\`\`\`

Current Website Pages JSON:
\`\`\`json
{{{jsonEncode currentPages}}}
\`\`\`
`,
});

const editWebsiteFlow = ai.defineFlow(
  {
    name: 'editWebsiteFlow',
    inputSchema: EditWebsiteInputSchema,
    outputSchema: EditWebsiteOutputSchema,
  },
  async (input) => {
     // Create a simplified representation of the component registry for the prompt
    const componentExamples = Object.fromEntries(
      Object.entries(componentRegistry).map(([key, value]) => [
        key,
        {
          description: value.description,
          defaultConfig: value.defaultConfig,
        },
      ])
    );
    
    // Augment the input object for the prompt
    const promptInput = {
      ...input,
      componentExamples,
    };

    const {output} = await editWebsitePrompt(promptInput);
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    
    // Ensure original data is returned if AI fails to modify it, preventing data loss
    if (!output.modifiedPages) {
        output.modifiedPages = input.currentPages;
    }
    if (!output.modifiedGlobalSettings) {
        output.modifiedGlobalSettings = input.globalSettings;
    }

    return output;
  }
);
