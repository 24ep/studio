export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import {
  enforceSingleActiveVersion,
  parseRequiredEmailTemplateCatalog,
  type EmailTemplateVersion,
} from '@/lib/email-template-catalog';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import { getSystemSetting } from '@/lib/systemSettings';

const saveVersionSchema = z.object({
  code: z.string().min(1).max(100),
  version: z.number().int().positive().optional(),
  subject: z.string().trim().min(1).max(300),
  html: z.string().trim().min(1).max(100_000),
  text: z.string().max(100_000).default(''),
  variables: z.array(z.string().max(100)).max(100).default([]),
  status: z.enum(['draft', 'active']),
});

const SETTING_KEY = 'emailTemplateCatalog';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'Admin' && !hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW'))) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    templates: parseRequiredEmailTemplateCatalog(await getSystemSetting(SETTING_KEY)),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'Admin' && !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT'))) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const parsed = saveVersionSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid email template version', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const catalog = parseRequiredEmailTemplateCatalog(await getSystemSetting(SETTING_KEY));
  const templateIndex = catalog.findIndex(template => template.code === parsed.data.code);
  if (templateIndex < 0) {
    return NextResponse.json({ message: 'Only templates required by Hrive can be versioned.' }, { status: 400 });
  }

  const template = catalog[templateIndex];
  const existingIndex = parsed.data.version === undefined
    ? -1
    : template.versions.findIndex(version => version.version === parsed.data.version);
  if (parsed.data.version !== undefined && existingIndex < 0) {
    return NextResponse.json({ message: 'Email template version not found.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const nextVersionNumber = Math.max(0, ...template.versions.map(version => version.version)) + 1;
  const previous = existingIndex >= 0 ? template.versions[existingIndex] : undefined;
  const savedVersion: EmailTemplateVersion = {
    version: previous?.version || nextVersionNumber,
    status: parsed.data.status,
    subject: parsed.data.subject,
    html: parsed.data.html,
    text: parsed.data.text,
    variables: parsed.data.variables,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  const versions = existingIndex >= 0
    ? template.versions.map((version, index) => index === existingIndex ? savedVersion : version)
    : [savedVersion, ...template.versions];
  template.versions = enforceSingleActiveVersion(
    versions
      .map(version => parsed.data.status === 'active' && version.version !== savedVersion.version
        ? { ...version, status: 'draft' as const }
        : version)
      .sort((a, b) => b.version - a.version),
  );

  await storeCatalog(catalog);
  if (savedVersion.status === 'active') await syncLegacyTemplateSettings(template.code, savedVersion);

  return NextResponse.json({ template, version: savedVersion }, { status: existingIndex >= 0 ? 200 : 201 });
}

async function storeCatalog(catalog: ReturnType<typeof parseRequiredEmailTemplateCatalog>) {
  await getPool().query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [SETTING_KEY, JSON.stringify(catalog)],
  );
}

async function syncLegacyTemplateSettings(code: string, version: EmailTemplateVersion) {
  const prefix = code === 'interview_invitation'
    ? 'emailTemplateInterviewInvitation'
    : code === 'offer_letter'
      ? 'emailTemplateOfferLetter'
      : null;
  if (!prefix) return;

  for (const [key, value] of [[`${prefix}Subject`, version.subject], [prefix, version.html]]) {
    await getPool().query(
      `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
      [key, value],
    );
  }
}
