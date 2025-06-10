// This file uses server-side code, and must have the `'use server'` directive.
'use server';

/**
 * @fileOverview Performs a code review on a given diff using Gemini.
 *
 * - codeReview - A function that performs the code review process.
 * - CodeReviewInput - The input type for the codeReview function.
 * - CodeReviewOutput - The return type for the codeReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeReviewInputSchema = z.object({
  diff: z
    .string()
    .describe('The diff content to be reviewed.'),
  fullReview: z.boolean().optional().default(false).describe('Whether to perform a full code review with style and nitpicks.'),
});
export type CodeReviewInput = z.infer<typeof CodeReviewInputSchema>;

const CodeReviewOutputSchema = z.object({
  review: z.string().describe('The code review feedback from Gemini.'),
});
export type CodeReviewOutput = z.infer<typeof CodeReviewOutputSchema>;

export async function codeReview(input: CodeReviewInput): Promise<CodeReviewOutput> {
  return codeReviewFlow(input);
}

const codeReviewPrompt = ai.definePrompt({
  name: 'codeReviewPrompt',
  input: {schema: CodeReviewInputSchema},
  output: {schema: CodeReviewOutputSchema},
  prompt: `You are a code review expert. Review the provided diff and provide feedback.

Prioritize identifying potential issues, problems, and key areas for improvement.

{{#if fullReview}}
Include style and nitpicks.
{{/if}}

Diff:
{{{diff}}}`, 
});

const codeReviewFlow = ai.defineFlow(
  {
    name: 'codeReviewFlow',
    inputSchema: CodeReviewInputSchema,
    outputSchema: CodeReviewOutputSchema,
  },
  async input => {
    const {output} = await codeReviewPrompt(input);
    return output!;
  }
);
