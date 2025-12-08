'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// -----------------------
// Simple stopwords list
// -----------------------
const STOPWORDS = new Set([
  'the',
  'and',
  'is',
  'a',
  'an',
  'to',
  'for',
  'on',
  'in',
  'of',
  'it',
  'this',
  'that',
  'i',
  'you',
  'we',
  'be',
  'by',
  'are',
  'as',
  'at',
  'from',
  'with',
  'your',
  'my',
  'our',
  'me',
  'can',
  'if',
  'please',
  'will',
  'was',
  'have',
  'has',
  'had',
]);

type Template = {
  raw: string;
  greeting: string;
  body: string;
  closing: string;
};

// -----------------------
// Utilities
// -----------------------
async function loadTemplates(corpusUrl: string): Promise<Template[]> {
  try {
    const response = await fetch(corpusUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch corpus: ${response.statusText}`);
    }
    const raw = await response.text();
    const blocks = raw.split('\n---\n').filter((b) => b.trim());
    const templates: Template[] = [];
    for (const b of blocks) {
      const lines = b.split('\n');
      const greeting = lines[0]?.trim() || '';
      const closing = lines[lines.length - 1]?.trim() || '';
      const body = lines.length > 2 ? lines.slice(1, -1).join('\n').trim() : '';
      templates.push({ raw: b, greeting, body, closing });
    }
    return templates;
  } catch (error) {
    console.error('Error loading corpus:', error);
    return [];
  }
}

function tokenize(text: string): string[] {
  const lowercased = text.toLowerCase();
  const noPunctuation = lowercased.replace(/[^\w\s]/g, ' ');
  const tokens = noPunctuation
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
  return tokens;
}

// -----------------------
// Matching & keywords
// -----------------------
function scoreOverlap(requestToks: string[], templateToks: string[]): number {
  const requestSet = new Set(requestToks);
  const templateSet = new Set(templateToks);
  let intersection = 0;
  for (const token of requestSet) {
    if (templateSet.has(token)) {
      intersection++;
    }
  }
  return intersection;
}

function pickBestTemplates(
  templates: Template[],
  userRequest: string,
  topK = 3
): [Template[], string[]] {
  const reqToks = tokenize(userRequest);
  const scored: [number, Template, string[]][] = [];
  for (const t of templates) {
    const allText = `${t.greeting} ${t.body} ${t.closing}`;
    const toks = tokenize(allText);
    const s = scoreOverlap(reqToks, toks);
    scored.push([s, t, toks]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const top = scored.slice(0, topK).map((item) => item[1]);
  return [top, reqToks];
}

// -----------------------
// Email assembly
// -----------------------
function fillPlaceholders(text: string, variables: Record<string, string>) {
  let result = text;
  for (const k in variables) {
    result = result.replace(new RegExp(`{${k}}`, 'g'), variables[k]);
  }
  return result;
}

function assembleEmail(
  chosenTemplates: Template[],
  variables: Record<string, string>
) {
  if (!chosenTemplates.length) {
    return "I'm sorry, I couldn't find a good template for your request.";
  }

  const parts = [];

  const greeting = chosenTemplates[0].greeting;
  parts.push(fillPlaceholders(greeting, variables));

  const body =
    (chosenTemplates.length > 1
      ? chosenTemplates[1].body
      : chosenTemplates[0].body) || chosenTemplates[0].body;
  parts.push(fillPlaceholders(body, variables));

  const closing = chosenTemplates[chosenTemplates.length - 1].closing;
  parts.push(fillPlaceholders(closing, variables));

  return parts.filter(Boolean).join('\n\n');
}

export async function getAssistantResponse(
  yourName: string,
  recipientName: string,
  userRequest: string
): Promise<string> {
  // Simulate network delay for a better user experience
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const corpusUrl = new URL('/corpus.txt', appUrl).toString();
    const templates = await loadTemplates(corpusUrl);
    
    const variables = {
      name: recipientName,
      your_name: yourName,
      yourName: yourName, // for backwards compatibility with some templates
      recipientName: recipientName,
      topic: 'your request', // Fallback
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      company: '[Company]',
      product: '[Product]',
      amount: '[Amount]',
      location: '[Location]',
      action: '[Action]',
      greeting: 'Hello'
    };

    const [chosen] = pickBestTemplates(templates, userRequest, 3);
    const email = assembleEmail(chosen, variables);

    return email;
  } catch (error) {
    console.error('Error processing message:', error);
    return "I'm sorry, but I encountered an error and can't respond right now.";
  }
}
