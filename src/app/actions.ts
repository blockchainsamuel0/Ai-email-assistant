'use server';

import fs from 'fs/promises';
import path from 'path';

const STOPWORDS = new Set([
  "the","and","is","a","an","to","for","on","in","of","it","this","that","i","you","we","be","by","are",
  "as","at","from","with","your","my","our","me","can","if","please","will","was","have","has","had"
]);

type Template = {
  raw: string;
  greeting: string;
  body: string;
  closing: string;
};

function loadTemplates(raw: string): Template[] {
  const blocks = raw.split("\n---\n").filter(b => b.trim());
  const templates: Template[] = [];
  for (const b of blocks) {
    const lines = b.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;
    const greeting = lines[0] || "";
    const closing = lines[lines.length - 1] || "";
    const body = lines.slice(1, lines.length - 1).join('\n').trim();
    templates.push({ raw: b, greeting, body, closing });
  }
  return templates;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  const lowercased = text.toLowerCase();
  const noPunctuation = lowercased.replace(/[^\w\s]/g, " ");
  const tokens = noPunctuation.split(/\s+/);
  return tokens.filter(t => t && !STOPWORDS.has(t));
}

function scoreOverlap(requestToks: string[], templateToks: string[]): number {
  const reqSet = new Set(requestToks);
  const templateSet = new Set(templateToks);
  let intersectionSize = 0;
  for (const token of reqSet) {
    if (templateSet.has(token)) {
      intersectionSize++;
    }
  }
  return intersectionSize;
}

function pickBestTemplates(templates: Template[], userRequest: string, topK = 3): [Template[], string[]] {
  const reqToks = tokenize(userRequest);
  const scored: { score: number; template: Template; toks: string[] }[] = [];
  for (const t of templates) {
    const allText = [t.greeting, t.body, t.closing].join(" ");
    const toks = tokenize(allText);
    const s = scoreOverlap(reqToks, toks);
    scored.push({ score: s, template: t, toks });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK).map(item => item.template);
  return [top, reqToks];
}

function fillPlaceholders(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

function assembleEmail(chosenTemplates: Template[], variables: Record<string, string>): string {
  if (!chosenTemplates || chosenTemplates.length === 0) {
    return "I'm sorry, I couldn't find a suitable response. Please try rephrasing your request.";
  }

  const parts: string[] = [];

  const greeting = chosenTemplates[0].greeting;
  if (greeting) {
    parts.push(fillPlaceholders(greeting, variables));
  }

  const body = chosenTemplates.length > 1 
    ? (chosenTemplates[1].body || chosenTemplates[0].body) 
    : chosenTemplates[0].body;
  
  if (body) {
    parts.push(fillPlaceholders(body, variables));
  }
  
  const closing = chosenTemplates[chosenTemplates.length - 1].closing;
  if (closing) {
    parts.push(fillPlaceholders(closing, variables));
  }

  return parts.filter(p => p.trim()).join('\n\n');
}

export async function getAssistantResponse(
  name: string,
  userRequest: string
): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const corpusPath = path.join(process.cwd(), 'src', 'lib', 'corpus.txt');
    const corpus = await fs.readFile(corpusPath, 'utf-8');
    const templates = loadTemplates(corpus);

    if (templates.length === 0) {
      return "I'm sorry, my knowledge base is empty.";
    }
    
    // These are default variables, they can be expanded upon
    const variables = {
        name: name || "Friend",
        topic: "your request",
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        company: "your company",
        product: "our product",
        amount: "$100",
        location: "the office",
        your_name: "Assistant",
        greeting: "Hi",
        action: "completed the task",
    };

    const [chosen] = pickBestTemplates(templates, userRequest, 3);
    const email = assembleEmail(chosen, variables);

    return email;
  } catch (error) {
    console.error('Error processing message:', error);
    return "I'm sorry, but I encountered an error and can't respond right now.";
  }
}
