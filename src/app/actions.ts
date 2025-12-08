'use server';

import { generateEmail } from '@/ai/flows/email-assistant-flow';

export async function getAssistantResponse(
  yourName: string,
  recipientName: string,
  userRequest: string
): Promise<string> {
  // Simulate network delay for a better user experience
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const email = await generateEmail({
      yourName,
      recipientName,
      userRequest,
    });
    return email;
  } catch (error) {
    console.error('Error processing message:', error);
    return "I'm sorry, but I encountered an error and can't respond right now.";
  }
}
