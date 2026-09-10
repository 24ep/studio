import { randomUUID } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Pool, PoolClient } from 'pg';

import { auth } from '@/auth';
import {
  AppKitSeedCollectionError,
  fetchAppKitSeedCollectionOrThrow,
} from '@/lib/appkit-sdk-client';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { normalizePolicyDocument, type AppKitPolicyDocument, type PolicyDocument } from '@/lib/policy-documents';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';

const STORE_KEY = 'policyDocumentsLocalStore';
const portalSchema = z.enum(['Employee portal', 'Job portal']);
const linkSchema = z.object({ label: z.string().trim().min(1).max(120), url: z.string().trim().url().max(2000) });
const documentSchema = z.object({
  id: z.string().trim().max(160).optional(),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().max(2000).default(''),
  category: z.string().trim().min(1).max(120).default('General'),
  status: z.enum(['Published', 'Draft', 'In review']).default('Draft'),
  path: z.string().trim().min(1).max(500),
  content: z.string().max(250_000).default(''),
  portals: z.array(portalSchema).max(2).default([]),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  externalLinks: z.array(linkSchema).max(30).default([]),
  versionNote: z.string().trim().max(240).optional(),
});

type Store = { documents: PolicyDocument[] };

function canManage(user: Parameters<typeof hasPermission>[0]) {
  if (!user) return false;
  return user.role === 'Admin' || hasPermission(user, 'COMPANY_PORTAL_MANAGE') || hasPermission(user, 'SYSTEM_SETTINGS_VIEW');
}

async function readStore(client: Pool | PoolClient = getPool()): Promise<Store> {
  const result = await client.query(`SELECT value FROM "SystemSetting" WHERE key = $1`, [STORE_KEY]);
  try {
    const parsed = JSON.parse(result.rows[0]?.value || '{}') as Partial<Store>;
    return { documents: Array.isArray(parsed.documents) ? parsed.documents : [] };
  } catch {
    return { documents: [] };
  }
}

async function writeStore(client: Pool | PoolClient, store: Store) {
  await client.query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [STORE_KEY, JSON.stringify(store)],
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const local = await readStore();
  const requestedEnvironment = request.nextUrl.searchParams.get('environment');
  const environment = requestedEnvironment === 'development' ? 'development' : 'production';
  const shouldImportAppKit = request.nextUrl.searchParams.get('importAppKit') === 'true';
  let appKitDocuments: PolicyDocument[] = [];
  let warning: string | undefined;
  if (shouldImportAppKit) {
    try {
      const records = await fetchAppKitSeedCollectionOrThrow<AppKitPolicyDocument>(environment, 'policy_documents');
      appKitDocuments = records
        .map(record => ({ document: normalizePolicyDocument(record), sortOrder: Number(record.sortOrder) || 0 }))
        .filter((item): item is { document: PolicyDocument; sortOrder: number } => Boolean(item.document))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.document.title.localeCompare(b.document.title))
        .map(item => item.document);
    } catch (error) {
      if (!(error instanceof AppKitSeedCollectionError)) throw error;
      warning = error.message;
      if (!local.documents.length) {
        return NextResponse.json({ error: error.message }, { status: error.code === 'not_configured' ? 503 : 502 });
      }
    }
  }
  const merged = new Map(appKitDocuments.map(document => [document.id, document]));
  for (const document of local.documents) merged.set(document.id, document);
  return NextResponse.json({ documents: [...merged.values()], canManage: canManage(session.user), warning }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await readRequestJsonResult(request);
  const environment = body.ok && (body.value as { environment?: unknown })?.environment === 'development'
    ? 'development'
    : 'production';
  try {
    const records = await fetchAppKitSeedCollectionOrThrow<AppKitPolicyDocument>(environment, 'policy_documents');
    const documents = records
      .map(record => ({ document: normalizePolicyDocument(record), sortOrder: Number(record.sortOrder) || 0 }))
      .filter((item): item is { document: PolicyDocument; sortOrder: number } => Boolean(item.document))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => item.document);
    await writeStore(getPool(), { documents });
    await logAudit('INFO', `Loaded ${documents.length} policy documents from AppKit.`, 'API:PolicyDocuments:ImportAppKit', session.user.id);
    return NextResponse.json({ count: documents.length, documents });
  } catch (error) {
    console.error('[PolicyDocuments] AppKit import failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Policy document import failed' }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await readRequestJsonResult(request);
  const parsed = body.ok ? documentSchema.safeParse(body.value) : null;
  if (!parsed?.success) return NextResponse.json({ error: 'Review the policy document fields.', details: parsed?.error.flatten() }, { status: 400 });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [STORE_KEY]);
    const store = await readStore(client);
    const requestedId = parsed.data.id || slugify(parsed.data.title);
    const existing = store.documents.find(document => document.id === requestedId);
    const now = new Date().toISOString();
    const version = {
      id: randomUUID(),
      createdAt: now,
      createdBy: session.user.name || session.user.email || 'Policy editor',
      note: parsed.data.versionNote || (existing ? 'Policy document updated' : 'Initial draft'),
      title: parsed.data.title,
      status: parsed.data.status,
      content: parsed.data.content,
    };
    const document: PolicyDocument = {
      id: requestedId,
      title: parsed.data.title,
      summary: parsed.data.summary,
      category: parsed.data.category,
      status: parsed.data.status,
      updated: now,
      owner: session.user.name || session.user.email || 'Policy editor',
      path: parsed.data.path,
      content: parsed.data.content,
      portals: parsed.data.portals,
      tags: parsed.data.tags,
      externalLinks: parsed.data.externalLinks,
      versions: [version, ...(existing?.versions || [])].slice(0, 50),
    };
    const documents = existing
      ? store.documents.map(item => item.id === requestedId ? document : item)
      : [document, ...store.documents];
    await writeStore(client, { documents });
    await client.query('COMMIT');
    await logAudit('AUDIT', `Policy document ${requestedId} saved.`, 'API:PolicyDocuments:Save', session.user.id, { documentId: requestedId, status: document.status });
    return NextResponse.json({ document }, { status: existing ? 200 : 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PolicyDocuments] Save failed:', error);
    return NextResponse.json({ error: 'Unable to save the policy document.' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'Document id is required.' }, { status: 400 });
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [STORE_KEY]);
    const store = await readStore(client);
    const documents = store.documents.filter(document => document.id !== id);
    if (documents.length === store.documents.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Local policy document not found.' }, { status: 404 });
    }
    await writeStore(client, { documents });
    await client.query('COMMIT');
    await logAudit('AUDIT', `Policy document ${id} deleted.`, 'API:PolicyDocuments:Delete', session.user.id, { documentId: id });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PolicyDocuments] Delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete the policy document.' }, { status: 500 });
  } finally {
    client.release();
  }
}

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  return slug || randomUUID();
}
