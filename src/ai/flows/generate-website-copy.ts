// 'use server';

/**
 * @fileOverview AI-powered website copy generator.
 *
 * - generateWebsiteCopy - A function that generates website copy suggestions.
 * - GenerateWebsiteCopyInput - The input type for the generateWebsiteCopy function.
 * - GenerateWebsiteCopyOutput - The return type for the generateWebsiteCopy function.
 */

'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWebsiteCopyInputSchema = z.object({
  websiteSection: z
    .string()
    .describe('The specific section of the website to generate copy for (e.g., "Homepage", "About Us", "Contact").'),
  keywords: z
    .string()
    .describe(
      'Keywords or phrases that should be included in the generated copy, separated by commas (e.g., "innovative, AI, solutions").'
    ),
  style: z
    .string()
    .describe(
      'The desired style or tone of the generated copy (e.g., "professional", "casual", "humorous").'
    ),
});
export type GenerateWebsiteCopyInput = z.infer<typeof GenerateWebsiteCopyInputSchema>;

const GenerateWebsiteCopyOutputSchema = z.object({
  copySuggestions: z
    .string()
    .describe('Generated copy suggestions for the specified website section, incorporating the provided keywords and style.'),
});
export type GenerateWebsiteCopyOutput = z.infer<typeof GenerateWebsiteCopyOutputSchema>;

export async function generateWebsiteCopy(input: GenerateWebsiteCopyInput): Promise<GenerateWebsiteCopyOutput> {
  return generateWebsiteCopyFlow(input);
}

const generateWebsiteCopyPrompt = ai.definePrompt({
  name: 'generateWebsiteCopyPrompt',
  input: {schema: GenerateWebsiteCopyInputSchema},
  output: {schema: GenerateWebsiteCopyOutputSchema},
  prompt: `You are an AI copywriter specializing in generating website content.

  Generate copy suggestions for the {{{websiteSection}}} section of a website, incorporating the following keywords: {{{keywords}}}. The copy should be written in a {{{style}}} style.

  Return just the copy. Do not include any extra preamble or postamble text.
  `,
});

const generateWebsiteCopyFlow = ai.defineFlow(
  {
    name: 'generateWebsiteCopyFlow',
    inputSchema: GenerateWebsiteCopyInputSchema,
    outputSchema: GenerateWebsiteCopyOutputSchema,
  },
  async input => {
    const {output} = await generateWebsiteCopyPrompt(input);
    return output!;
  }
);
