
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
  useProModel: z.boolean().optional().default(false).describe('Whether to use the Gemini 2.5 Pro model (defaults to Gemini 2.5 Flash).'),
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
  prompt: `You are a Senior Software Engineer. Review the provided diff and provide feedback.

Focus on identifying potential issues, problems, and key areas for improvement.

Don't explain the code or comment on things that are not worth rising awarness.

{{#if fullReview}}
Also include style and nitpicks, and general improvements.
{{/if}}

Structure the review by first showing the file name in heabold.
Then the review of the changes for that file. If you can provide possible solutions or fixes within a code block.

If a file has nothing worth mentioning, because its fine or otherwise, simple mention them at the end of the review
to let the user know that these have been reviewed as well.



Diff:
{{{diff}}}`,
});

const codeReviewFlow = ai.defineFlow(
  {
    name: 'codeReviewFlow',
    inputSchema: CodeReviewInputSchema,
    outputSchema: CodeReviewOutputSchema,
  },
  async (input: CodeReviewInput) => {
    const modelToUse = input.useProModel ? 'googleai/gemini-1.5-pro' : 'googleai/gemini-2.0-flash';
    const {output} = await codeReviewPrompt(input, { model: modelToUse });
    return output!;
  }
);

