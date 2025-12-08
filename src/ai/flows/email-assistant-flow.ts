'use server';
/**
 * @fileOverview An email generation AI agent.
 *
 * - generateEmail - A function that handles the email generation process.
 * - EmailAssistantInput - The input type for the generateEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EmailAssistantInputSchema = z.object({
  yourName: z.string().describe("The name of the person sending the email."),
  recipientName: z.string().describe("The name of the person receiving the email."),
  userRequest: z.string().describe("The user's request for the email content."),
});
export type EmailAssistantInput = z.infer<typeof EmailAssistantInputSchema>;

export async function generateEmail(input: EmailAssistantInput): Promise<string> {
  return emailAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emailAssistantPrompt',
  input: { schema: EmailAssistantInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert email assistant. Your task is to write a professional and effective email based on the user's request.

- Sender: {{{yourName}}}
- Recipient: {{{recipientName}}}
- Request: {{{userRequest}}}

Generate the full email content, including a greeting, body, and closing. Do not include a subject line.
`,
});

const emailAssistantFlow = ai.defineFlow(
  {
    name: 'emailAssistantFlow',
    inputSchema: EmailAssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await prompt(input);
    return response.text;
  }
);
