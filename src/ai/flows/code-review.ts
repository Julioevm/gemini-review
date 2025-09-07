'use server';

import { z } from 'zod';
import { generateText } from 'ai';
import { getModel } from '@/ai/providers/ai-sdk';

/**
* @fileOverview Performs a code review on a given diff using the selected provider.
* The API key is provided by the client.
*
* - codeReview - A function that performs the code review process.
* - CodeReviewInput - The input type for the codeReview function.
* - CodeReviewOutput - The return type for the codeReview function.
*/

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

  // Construct the prompt string using the custom instructions
  const promptText = `${reviewInstructions}

Diff:
${diff}`;

  try {
    const model = getModel({ provider, apiKey, useProModel });

    const response = await generateText({
      model,
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
      const msg = (e.message || '').toLowerCase();

      // Normalize common invalid/permission errors across providers
      if (
        msg.includes('api key') && msg.includes('invalid') ||
        msg.includes('invalid api key') ||
        msg.includes('permission') ||
        msg.includes('unauthorized') ||
        msg.includes('401')
      ) {
        throw new Error('The provided API Key is invalid or does not have the required permissions. Please check your API Key and try again.');
      }

      // Re-throw original error if not matched above
      throw e;
    }
    // If 'e' is not an Error instance, wrap it in a new Error
    throw new Error(`An unexpected error occurred during AI generation: ${String(e)}`);
  }
}
