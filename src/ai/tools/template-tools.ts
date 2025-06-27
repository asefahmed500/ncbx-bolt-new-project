
/**
 * @fileOverview AI tools for interacting with website templates.
 *
 * - applyTemplate - A tool to fetch the structure of a given template by name.
 */
import { ai } from '@/ai/genkit';
import { getTemplateByName } from '@/actions/templates';
import { z } from 'genkit';

// Define the Zod schema for the tool's output to match a template's page structure.
const PageComponentConfigSchema_Zod = z.object({
    text: z.string().optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
    htmlContent: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
}).passthrough();
const PageComponentSchema_Zod = z.object({
  _id: z.string().optional(),
  type: z.string(),
  config: PageComponentConfigSchema_Zod,
  order: z.number(),
});
const PageSchema_Zod = z.object({
  _id: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  elements: z.array(PageComponentSchema_Zod),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});


export const applyTemplate = ai.defineTool(
  {
    name: 'applyTemplate',
    description: 'Fetches the structure of a publicly available template by its exact name. Use this when a user wants to apply a specific design or layout to the current page.',
    inputSchema: z.object({
      templateName: z.string().describe("The exact name of the template to apply, e.g., 'Business Starter' or 'Minimal Portfolio'."),
    }),
    outputSchema: z.object({
        pages: z.array(PageSchema_Zod).describe("The array of pages from the fetched template. Often just one page.")
    }),
  },
  async (input) => {
    console.log(`[AI Tool] applyTemplate called with name: "${input.templateName}"`);
    const result = await getTemplateByName(input.templateName);

    if (result.error || !result.template) {
        throw new Error(result.error || "Template not found.");
    }

    // The tool returns the page structure, which the LLM will then use.
    return { pages: result.template.pages };
  }
);
