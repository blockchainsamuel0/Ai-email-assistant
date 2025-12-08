'use server';

import fs from 'fs/promises';
import path from 'path';

export async function getAssistantResponse(
  name: string,
  topic: string
): Promise<string> {
  // Simulate network delay for a more realistic feel
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const corpusPath = path.join(process.cwd(), 'src', 'lib', 'corpus.txt');
    const corpus = await fs.readFile(corpusPath, 'utf-8');
    const lines = corpus.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return "I'm sorry, my knowledge base is empty.";
    }

    // Select a random line from the corpus
    const randomLine = lines[Math.floor(Math.random() * lines.length)];

    // Replace placeholders
    const assistantResponseContent = randomLine
      .replace(/{name}/g, name)
      .replace(/{topic}/g, topic);

    return assistantResponseContent;
  } catch (error) {
    console.error('Error processing message:', error);
    return "I'm sorry, but I encountered an error and can't respond right now.";
  }
}
