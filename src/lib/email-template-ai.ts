import type { EmailTemplateAttribute } from './email-template-attributes';
import { formatEmailTemplateAttribute } from './email-template-attributes';

export type EmailTemplateTone = 'warm-professional' | 'concise' | 'formal';

type BuildEmailTemplatePromptInput = {
  name: string;
  description: string;
  tone: EmailTemplateTone;
  instructions?: string;
  attributes: EmailTemplateAttribute[];
};

export type GeneratedEmailTemplate = {
  subject: string;
  html: string;
};

const toneDescriptions: Record<EmailTemplateTone, string> = {
  'warm-professional': 'warm, professional, reassuring, and easy to understand',
  concise: 'concise, direct, and action-oriented',
  formal: 'formal, precise, and respectful',
};

export function buildEmailTemplateAiPrompt(input: BuildEmailTemplatePromptInput): string {
  const attributeGuide = input.attributes
    .map(attribute => `- ${formatEmailTemplateAttribute(attribute.key)}: ${attribute.description}`)
    .join('\n');

  return `You are an expert HR communications writer and email designer.

Create a complete transactional email template for Hrive.

Template name: ${input.name}
Purpose: ${input.description}
Tone: ${toneDescriptions[input.tone]}
${input.instructions?.trim() ? `Additional instructions: ${input.instructions.trim()}` : ''}

Available dynamic attributes:
${attributeGuide}

Requirements:
- Return one useful subject line and one polished HTML email body.
- Use only the dynamic attributes listed above, with their spelling and capitalization unchanged.
- Include the attributes that are relevant to the template purpose. Never invent sample personal data in their place.
- Keep the email focused, accessible, mobile-friendly, and suitable for an HR business workflow.
- Use semantic HTML and conservative inline styles that work in common email clients.
- Do not include scripts, forms, external images, markdown, commentary, or a full document wrapper.
- Return valid JSON only, exactly in this shape: {"subject":"...","html":"..."}`;
}

export function parseGeneratedEmailTemplate(value: string): GeneratedEmailTemplate {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('AI returned an invalid email template. Please try again.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    throw new Error('AI returned an invalid email template. Please try again.');
  }

  if (!isRecord(parsed) || typeof parsed.subject !== 'string' || typeof parsed.html !== 'string') {
    throw new Error('AI returned an incomplete email template. Please try again.');
  }

  const subject = parsed.subject.trim();
  const html = parsed.html.trim();
  if (!subject || !html) {
    throw new Error('AI returned an incomplete email template. Please try again.');
  }

  return { subject, html };
}

export function findUnsupportedEmailTemplateAttributes(
  template: GeneratedEmailTemplate,
  allowedKeys: string[],
): string[] {
  const allowed = new Set(allowedKeys);
  const used = `${template.subject}\n${template.html}`.matchAll(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g);
  return [...new Set([...used].map(match => match[1]).filter(key => !allowed.has(key)))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
