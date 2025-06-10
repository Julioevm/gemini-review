'use server';

/**
 * @fileOverview Summarizes a code review using Gemini, focusing on issues and improvements. 
 *
 * - summarizeFullCodeReview - A function that summarizes a full code review from Gemini.
 * - SummarizeCodeReviewInput - The input type for the summarizeFullCodeReview function.
 * - SummarizeCodeReviewOutput - The return type for the summarizeFullCodeReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCodeReviewInputSchema = z.object({
  diffContent: z
    .string()
    .describe("The content of the diff file, representing the code changes."),
});
export type SummarizeCodeReviewInput = z.infer<typeof SummarizeCodeReviewInputSchema>;

const SummarizeCodeReviewOutputSchema = z.object({
  reviewSummary: z
    .string()
    .describe("A summary of the code review, highlighting key issues, problems, and areas for improvement, including style and nitpicks."),
});
export type SummarizeCodeReviewOutput = z.infer<typeof SummarizeCodeReviewOutputSchema>;

export async function summarizeFullCodeReview(
  input: SummarizeCodeReviewInput
): Promise<SummarizeCodeReviewOutput> {
  return summarizeCodeReviewFlow(input);
}

const summarizeCodeReviewPrompt = ai.definePrompt({
  name: 'summarizeCodeReviewPrompt',
  input: {schema: SummarizeCodeReviewInputSchema},
  output: {schema: SummarizeCodeReviewOutputSchema},
  prompt: `You are an expert code reviewer. Please review the following code changes represented by the diff content.

Diff Content:
\`\`\`
{{{diffContent}}}
\`\`\`

Focus on identifying issues, problems, key areas for improvement, coding style and nitpicks. Provide a detailed and comprehensive summary of the code review.
`,
});

const summarizeCodeReviewFlow = ai.defineFlow(
  {
    name: 'summarizeCodeReviewFlow',
    inputSchema: SummarizeCodeReviewInputSchema,
    outputSchema: SummarizeCodeReviewOutputSchema,
  },
  async input => {
    const {output} = await summarizeCodeReviewPrompt(input);
    return output!;
  }
);
