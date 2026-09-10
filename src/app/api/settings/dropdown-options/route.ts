export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import { getPool } from '@/lib/db';
import { DROPDOWN_OPTION_CATALOG_SETTING, dropdownOptionCatalogDefaults, normalizeDropdownOptionCatalog } from '@/lib/dropdown-option-catalog';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import { SYSTEM_SETTINGS_CACHE_TAG } from '@/lib/systemSettings';

async function storedCatalog() {
  const result = await getPool().query('SELECT value FROM "SystemSetting" WHERE key = $1', [DROPDOWN_OPTION_CATALOG_SETTING]);
  if (!result.rows[0]?.value) return [];
  try { return normalizeDropdownOptionCatalog(JSON.parse(result.rows[0].value)); } catch { return []; }
}

async function saveCatalog(catalog: unknown, overwrite: boolean) {
  const normalized = normalizeDropdownOptionCatalog(catalog);
  if (!normalized.length) throw new Error('Dropdown catalog contains no valid groups.');
  if (normalized.some(group => !group.options.some(option => option.isActive))) {
    throw new Error('Every dropdown group must keep at least one active option.');
  }
  await getPool().query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO ${overwrite ? 'UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()' : 'NOTHING'}`,
    [DROPDOWN_OPTION_CATALOG_SETTING, JSON.stringify(normalized)],
  );
  revalidateTag(SYSTEM_SETTINGS_CACHE_TAG);
  return normalized;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  let catalog = await storedCatalog();
  if (!catalog.length) catalog = dropdownOptionCatalogDefaults;
  const key = request.nextUrl.searchParams.get('key');
  if (key) return NextResponse.json(catalog.find(group => group.key === key)?.options || []);
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  return NextResponse.json(catalog);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const body = await readRequestJsonResult(request);
  const input = body.ok && body.value && typeof body.value === 'object' ? body.value as { environment?: unknown; force?: unknown } : {};
  const environment = input.environment === 'development' ? 'development' : 'production';
  const existing = await storedCatalog();
  if (existing.length && input.force !== true) return NextResponse.json({ count: existing.length, environment, existing: true });
  const records = await fetchAppKitSeedCollection<Record<string, unknown>>(environment, 'dropdown_option_catalog');
  const catalog = normalizeDropdownOptionCatalog(records.map(record => ({ ...record, options: typeof record.options === 'string' ? JSON.parse(record.options) : record.options })));
  if (!catalog.length) return NextResponse.json({ message: `No dropdown catalog found in AppKit ${environment}.` }, { status: 404 });
  await saveCatalog(catalog, true);
  return NextResponse.json({ count: catalog.length, environment });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const body = await readRequestJsonResult(request);
  if (!body.ok) return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  try { return NextResponse.json(await saveCatalog(body.value, true)); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid catalog' }, { status: 400 }); }
}
