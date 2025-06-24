import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// This global 'ai' object will primarily rely on GOOGLE_API_KEY environment variable.
// Flows that need to use a DB-configured API key will initialize their own local Genkit instance.
export const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-pro', // Default model, can be overridden in generate calls
});
