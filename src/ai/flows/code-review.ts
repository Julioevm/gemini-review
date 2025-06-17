
// This file uses server-side code, and must have the `'use server'` directive.
'use server';

/**
 * @fileOverview Performs a code review on a given diff using Gemini.
 * The API key is provided by the client.
 *
 * - codeReview - A function that performs the code review process.
 * - CodeReviewInput - The input type for the codeReview function.
 * - CodeReviewOutput - The return type for the codeReview function.
 */

import { genkit } from 'genkit'; // Import genkit directly
import { googleAI } from '@genkit-ai/googleai'; // Import googleAI plugin directly
import { z } from 'genkit'; // z comes from genkit

const CodeReviewInputSchema = z.object({
  diff: z.string().describe('The diff content to be reviewed.'),
  reviewInstructions: z.string().describe('The custom instructions for the code review model.'),
  useProModel: z.boolean().optional().default(false).describe('Whether to use the Gemini 2.5 Pro model (defaults to Gemini 2.5 Flash).'),
  apiKey: z.string().describe('The Gemini API key provided by the user.'),
});
export type CodeReviewInput = z.infer<typeof CodeReviewInputSchema>;

const CodeReviewOutputSchema = z.object({
  review: z.string().describe('The code review feedback from Gemini.'),
});
export type CodeReviewOutput = z.infer<typeof CodeReviewOutputSchema>;

export async function codeReview(input: CodeReviewInput): Promise<CodeReviewOutput> {
  const { diff, reviewInstructions, useProModel, apiKey } = input;

  if (!apiKey) {
    throw new Error('API Key is required to perform a code review.');
  }

  // Dynamically initialize Genkit with the provided API key
  const dynamicAi = genkit({
    plugins: [googleAI({ apiKey })],
  });

  const modelName = useProModel ? 'gemini-2.5-pro-preview-03-25' : 'gemini-2.5-flash-preview-04-17';
  const model = googleAI.model(modelName);

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
    console.error("Error during AI generation:", e);
    if (e instanceof z.ZodError) {
      throw new Error(`Output validation error: ${e.errors.map(err => err.message).join(', ')}`);
    }
    if (e instanceof Error && (e.message.includes('API key not valid') || e.message.includes('permission denied'))) {
        throw new Error('The provided API Key is invalid or does not have the required permissions. Please check your API Key and try again.');
    }
    throw e;
  }
}
