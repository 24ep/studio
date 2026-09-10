import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import {
  AppKitSeedCollectionError,
  fetchAppKitSeedCollectionOrThrow,
} from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import { parseDocumentTemplates, type DocumentTemplate } from '@/lib/document-templates';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  description: z.string().max(300),
  category: z.string().min(1).max(60),
  content: z.string().min(1).max(100_000),
  status: z.enum(['active', 'draft']),
  isConfidential: z.boolean(),
  employeeCanDownload: z.boolean(),
  updatedAt: z.string(),
});

const templatesSchema = z.object({ templates: z.array(templateSchema).max(100) });
const importSchema = z.object({ environment: z.enum(['development', 'production']).default('production') });
const SETTING_KEY = 'documentTemplates';

function canView(user: { role?: string; modulePermissions?: string[] }) {
  return user.role === 'Admin' || hasPermission(user, 'SYSTEM_SETTINGS_VIEW');
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canView(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await getPool().query<{ value: string }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [SETTING_KEY],
  );
  return NextResponse.json({
    templates: result.rows[0] ? parseDocumentTemplates(result.rows[0].value) : [],
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Admin' && !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  const input = importSchema.safeParse(body.ok ? body.value : {});
  if (!input.success) return NextResponse.json({ error: 'Invalid import options' }, { status: 400 });

  let records;
  try {
    records = await fetchAppKitSeedCollectionOrThrow<AppKitDocumentTemplate>(
      input.data.environment,
      'document_templates',
    );
  } catch (error) {
    if (error instanceof AppKitSeedCollectionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'not_configured' ? 503 : 502 },
      );
    }
    throw error;
  }
  const templates = records
    .map((record, index) => ({
      template: {
        id: record.__appkitId || `appkit-document-${index}`,
        name: String(record.name || '').trim(),
        description: String(record.description || ''),
        category: String(record.category || 'General'),
        content: String(record.content || ''),
        status: record.status === 'active' ? 'active' as const : 'draft' as const,
        isConfidential: record.isConfidential === true,
        employeeCanDownload: record.employeeCanDownload !== false,
        updatedAt: new Date().toISOString(),
      },
      sortOrder: Number(record.sortOrder) || 0,
    }))
    .filter(item => item.template.name && item.template.content)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => item.template);

  await storeTemplates(templates);
  return NextResponse.json({ templates, count: templates.length });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Admin' && !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await readRequestJsonResult(request);
  if (!body.ok) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  const parsed = templatesSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid template data' }, { status: 400 });

  await storeTemplates(parsed.data.templates);
  return NextResponse.json({ templates: parsed.data.templates });
}

type AppKitDocumentTemplate = {
  name?: string;
  description?: string;
  category?: string;
  content?: string;
  status?: string;
  isConfidential?: boolean;
  employeeCanDownload?: boolean;
  sortOrder?: number;
};

async function storeTemplates(templates: DocumentTemplate[]) {
  await getPool().query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [SETTING_KEY, JSON.stringify(templates)],
  );
}
