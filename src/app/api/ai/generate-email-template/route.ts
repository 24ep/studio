import { NextResponse, type NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

import { auth } from '@/auth';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { logAudit } from '@/lib/auditLog';
import {
  buildEmailTemplateAiPrompt,
  findUnsupportedEmailTemplateAttributes,
  parseGeneratedEmailTemplate,
} from '@/lib/email-template-ai';
import { getEmailTemplateAttributes } from '@/lib/email-template-attributes';
import { EMAIL_TEMPLATE_REQUIREMENTS } from '@/lib/email-template-requirements';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const requestSchema = z.object({
  code: z.string().trim().min(1).max(100),
  tone: z.enum(['warm-professional', 'concise', 'formal']).default('warm-professional'),
  instructions: z.string().trim().max(1_000).default(''),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'Admin' && !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const parsed = requestSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid AI email template request', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const requirement = EMAIL_TEMPLATE_REQUIREMENTS.find(template => template.code === parsed.data.code);
  if (!requirement) {
    return NextResponse.json({ message: 'Email template type not found' }, { status: 404 });
  }

  try {
    const attributes = getEmailTemplateAttributes(requirement.code);
    const prompt = buildEmailTemplateAiPrompt({
      name: requirement.name,
      description: requirement.description,
      tone: parsed.data.tone,
      instructions: parsed.data.instructions,
      attributes,
    });
    const result = await executeWithApiKeyFallback(
      (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, prompt, {
        temperature: 0.6,
        maxOutputTokens: 4096,
      }),
      'Generate Email Template',
    );

    if (!result.success) {
      return NextResponse.json({
        message: `AI generation is unavailable because all configured ${getProviderLabel(result.provider)} keys failed. Check the AI provider configuration.`,
        attempts: result.attempts,
        lastError: result.error,
      }, { status: 503 });
    }

    const generated = parseGeneratedEmailTemplate(result.data || '');
    const unsupportedAttributes = findUnsupportedEmailTemplateAttributes(
      generated,
      attributes.map(attribute => attribute.key),
    );
    if (unsupportedAttributes.length) {
      throw new Error(`AI used unsupported attributes: ${unsupportedAttributes.map(key => `{{${key}}}`).join(', ')}. Please try again.`);
    }
    const html = sanitizeGeneratedEmailHtml(generated.html);
    if (!html.trim()) {
      throw new Error('AI returned an empty email body. Please try again.');
    }

    await logAudit(
      'AUDIT',
      `AI email template draft generated for: ${requirement.name}`,
      'API:AI:GenerateEmailTemplate',
      session.user.id,
      { templateCode: requirement.code, tone: parsed.data.tone },
    );

    return NextResponse.json({ success: true, subject: generated.subject, html });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate email template';
    console.error('Error generating email template:', error);
    await logAudit('ERROR', message, 'API:AI:GenerateEmailTemplate', session.user.id, { templateCode: requirement.code });
    return NextResponse.json({ message }, { status: 500 });
  }
}

function sanitizeGeneratedEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'section', 'header', 'footer']),
    allowedAttributes: {
      '*': ['class', 'style', 'title', 'role', 'aria-*'],
      a: ['href', 'target', 'rel', 'style'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      table: ['width', 'border', 'cellpadding', 'cellspacing', 'align', 'bgcolor', 'style'],
      td: ['width', 'colspan', 'rowspan', 'align', 'valign', 'bgcolor', 'style'],
      th: ['width', 'colspan', 'rowspan', 'align', 'valign', 'bgcolor', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowProtocolRelative: false,
  });
}
