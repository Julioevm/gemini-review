'use server';

/**
* @fileOverview Performs a code review on a given diff using the selected provider.
* The API key is provided by the client.
*
* - codeReview - A function that performs the code review process.
* - CodeReviewInput - The input type for the codeReview function.
* - CodeReviewOutput - The return type for the codeReview function.
*/

import { genkit, z } from 'genkit';
import { googleAI, gemini25FlashPreview0417, gemini25ProExp0325 } from '@genkit-ai/googleai';
import  openAI, { gpt41, gpt41Mini } from 'genkitx-openai';
import { anthropic, claude4Sonnet, claude4Opus } from 'genkitx-anthropic';

const ProviderEnum = z.enum(['gemini', 'openai', 'anthropic']);
export type Provider = z.infer<typeof ProviderEnum>;

const CodeReviewInputSchema = z.object({
 diff: z.string().describe('The diff content to be reviewed.'),
 reviewInstructions: z.string().describe('The custom instructions for the code review model.'),
 useProModel: z.boolean().optional().default(false).describe('Whether to use the strong model (defaults to the weak model).'),
 apiKey: z.string().describe('The API key provided by the user for the selected provider.'),
 provider: ProviderEnum.describe('The selected AI provider to use for the review.'),
});
export type CodeReviewInput = z.infer<typeof CodeReviewInputSchema>;

const CodeReviewOutputSchema = z.object({
 review: z.string().describe('The code review feedback from the model.'),
});
export type CodeReviewOutput = z.infer<typeof CodeReviewOutputSchema>;

export async function codeReview(input: CodeReviewInput): Promise<CodeReviewOutput> {
 const { diff, reviewInstructions, useProModel, apiKey, provider } = input;

 if (!apiKey) {
   throw new Error('API Key is required to perform a code review.');
 }

 // Select plugin, vendor namespace and model id based on provider + toggle
 let plugin: ReturnType<typeof googleAI> | ReturnType<typeof openAI> | ReturnType<typeof anthropic>;
 let vendor: 'googleai' | 'openai' | 'anthropic';
 let model: any;

 switch (provider) {
   case 'gemini':
     plugin = googleAI({ apiKey });
     vendor = 'googleai';
     model = useProModel ? gemini25ProExp0325 : gemini25FlashPreview0417;
     break;
   case 'openai':
     plugin = openAI({ apiKey });
     vendor = 'openai';
     model = useProModel ? gpt41 : gpt41Mini;
     break;
   case 'anthropic':
     plugin = anthropic({ apiKey });
     vendor = 'anthropic';
     model = useProModel ? claude4Opus : claude4Sonnet;
     break;
   default:
     throw new Error(`Unsupported provider: ${String(provider)}`);
 }

 const dynamicAi = genkit({
   plugins: [plugin],
 });


 // Construct the prompt string using the custom instructions
 const promptText = `${reviewInstructions}

Diff:
${diff}`;

 try {
   const response = await dynamicAi.generate({
     model: model,
     prompt: promptText,
   });

   const reviewText = response.text;
   if (reviewText === undefined) {
     throw new Error('Failed to generate review. No text output received from the model.');
   }

   const validatedOutput = CodeReviewOutputSchema.parse({ review: reviewText });
   return validatedOutput;

 } catch (e) {
   console.error('Error during AI generation:', e);
   if (e instanceof z.ZodError) {
     throw new Error(`Output validation error: ${e.errors.map(err => err.message).join(', ')}`);
   }
   if (e instanceof Error) {
     if (
       e.message.includes('API key not valid') ||
       e.message.includes('permission denied') ||
       e.message.includes('API_KEY_INVALID')
     ) {
       throw new Error('The provided API Key is invalid or does not have the required permissions. Please check your API Key and try again.');
     }
     // Re-throw the original error if it's already an Error instance and not a specific handled one
     throw e;
   }
   // If 'e' is not an Error instance, wrap it in a new Error
   throw new Error(`An unexpected error occurred during AI generation: ${String(e)}`);
 }
}

