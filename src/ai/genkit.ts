import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (typeof window === 'undefined' && !process.env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not set. AI features will not work. Please set it in your .env file.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
