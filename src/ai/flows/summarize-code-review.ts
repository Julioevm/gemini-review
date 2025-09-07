'use server';

/**
 * @fileOverview Summarizes a code review using the selected provider, focusing on issues and improvements.
 *
 * - summarizeFullCodeReview - A function that summarizes a full code review.
 * - SummarizeCodeReviewInput - The input type for the summarizeFullCodeReview function.
 * - SummarizeCodeReviewOutput - The return type for the summarizeFullCodeReview function.
 */

import { z } from 'zod';
import { generateText } from 'ai';
import { getModel } from '@/ai/providers/ai-sdk';

const ProviderEnum = z.enum(['gemini', 'openai', 'anthropic']);
export type Provider = z.infer<typeof ProviderEnum>;

const SummarizeCodeReviewInputSchema = z.object({
  diffContent: z
    .string()
    .describe('The content of the diff file, representing the code changes.'),
  apiKey: z
    .string()
    .describe('The API key provided by the user for the selected provider.'),
  provider: ProviderEnum.default('gemini').describe('The selected AI provider to use for the summary.'),
  useProModel: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use the strong model (defaults to the weak model).'),
});
export type SummarizeCodeReviewInput = z.infer<typeof SummarizeCodeReviewInputSchema>;

const SummarizeCodeReviewOutputSchema = z.object({
  reviewSummary: z
    .string()
    .describe(
      'A summary of the code review, highlighting key issues, problems, and areas for improvement, including style and nitpicks.'
    ),
});
export type SummarizeCodeReviewOutput = z.infer<typeof SummarizeCodeReviewOutputSchema>;

export async function summarizeFullCodeReview(
  input: SummarizeCodeReviewInput
): Promise<SummarizeCodeReviewOutput> {
  const parsed = SummarizeCodeReviewInputSchema.parse(input);
  const { diffContent, apiKey, provider, useProModel } = parsed;

  if (!apiKey) {
    throw new Error('API Key is required to summarize a code review.');
  }

  const prompt = `You are an expert code reviewer. Please review the following code changes represented by the diff content.

Diff Content:
\`\`\`
${diffContent}
\`\`\`

Focus on identifying issues, problems, key areas for improvement, coding style and nitpicks. Provide a detailed and comprehensive summary of the code review.`;

  try {
    const model = getModel({ provider, apiKey, useProModel });

    const { text } = await generateText({
      model,
      prompt,
    });

    if (!text) {
      throw new Error('Failed to generate summary. No text output received from the model.');
    }

    const output = SummarizeCodeReviewOutputSchema.parse({ reviewSummary: text });
    return output;
  } catch (e) {
    console.error('Error during AI generation (summary):', e);
    if (e instanceof z.ZodError) {
      throw new Error(`Output validation error: ${e.errors.map((err) => err.message).join(', ')}`);
    }
    if (e instanceof Error) {
      const msg = (e.message || '').toLowerCase();
      if (
        msg.includes('api key') && msg.includes('invalid') ||
        msg.includes('invalid api key') ||
        msg.includes('permission') ||
        msg.includes('unauthorized') ||
        msg.includes('401')
      ) {
        throw new Error(
          'The provided API Key is invalid or does not have the required permissions. Please check your API Key and try again.'
        );
      }
      throw e;
    }
    throw new Error(`An unexpected error occurred during AI generation: ${String(e)}`);
  }
}
