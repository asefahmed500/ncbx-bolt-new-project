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

// Re-using schemas from the generation flow for consistency.
const PageComponentConfigSchema_Zod = z.record(z.any()).describe('A flexible object for component configuration.');
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

// Input and Output types for the flow
export const EditWebsiteInputSchema = z.object({
  prompt: z.string().describe('The user\'s command for editing the website.'),
  currentPages: z.array(PageSchema_Zod).describe('The current JSON structure of all pages on the website.'),
  activePageSlug: z.string().describe('The slug of the page currently being viewed by the user in the editor.'),
});
export type EditWebsiteInput = z.infer<typeof EditWebsiteInputSchema>;

export const EditWebsiteOutputSchema = z.object({
  modifiedPages: z.array(PageSchema_Zod).describe('The complete, modified JSON structure of the pages.'),
  explanation: z.string().describe('A brief, user-facing explanation of what changes were made.'),
});
export type EditWebsiteOutput = z.infer<typeof EditWebsiteOutputSchema>;

// The exported function that client-side code will call.
export async function editWebsite(input: EditWebsiteInput): Promise<EditWebsiteOutput> {
  return editWebsiteFlow(input);
}

const availableComponentTypes = Object.keys(componentRegistry).join(', ');

const editWebsitePrompt = ai.definePrompt({
  name: 'editWebsitePrompt',
  input: {schema: EditWebsiteInputSchema},
  output: {schema: EditWebsiteOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert web designer AI assistant integrated into a website builder.
A user has provided a prompt to edit their current website.
Your task is to analyze the user's prompt and the current website structure (provided as 'currentPages' JSON), and then return the complete, modified JSON structure that reflects the requested changes.

User's Prompt: "{{{prompt}}}"
Currently Active Page Slug: "{{{activePageSlug}}}"

Available component types are: [${availableComponentTypes}]

Instructions:
1.  **Analyze the Request**: Understand if the user wants to add, delete, or modify a component, change a style, add a page, or perform a general restructuring. Most changes should be applied to the currently active page unless the user specifies otherwise (e.g., "add a contact page").
2.  **Modify the JSON**: Directly manipulate the 'currentPages' JSON to apply the changes. Do not just describe the changes; you must return the full, updated JSON object.
3.  **Return Modified Structure**: Your primary output is the 'modifiedPages' field, which should contain the entire, updated array of page objects.
4.  **Explain Your Actions**: In the 'explanation' field, provide a short, friendly message to the user explaining what you did. For example, "I've added a pricing table to your Services page," or "I've changed the background color of the hero section."
5.  **Be Smart**:
    - If adding a component (e.g., "add a hero section"), populate it with relevant placeholder content based on the website's context.
    - If changing a style (e.g., "make the background dark blue"), find the relevant component (like a 'section' or 'hero') and update its 'backgroundColor' in the config. Use hex color codes.
    - If adding a new page (e.g., "create an 'About Us' page"), add a new page object to the 'pages' array with a suitable name and slug, and add some basic components to it.
    - **IMPORTANT**: When you add a new component or a new page, you must generate a new unique '_id' for it. An ID can be a short random string of letters and numbers.
6.  **If Unsure**: If the prompt is too vague or you cannot fulfill it, return the original, unmodified 'currentPages' structure and use the 'explanation' field to ask for clarification. For example: "I can do that, but which section's background color would you like to change?"

Current Website JSON:
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
    const {output} = await editWebsitePrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    return output;
  }
);
