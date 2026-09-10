import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import {
  createDefaultCompanyPortalState,
  parseCompanyPortalState,
  restoreCompanyPortalSchema,
  saveCompanyPortalSchema,
  type CompanyPortalState,
} from '@/lib/company-portal-builder';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';
import { loadCompanyPortalLiveRecords } from '@/lib/company-portal-live-data';

export const dynamic = 'force-dynamic';

const EMPLOYEE_PORTAL_SETTING_KEY = 'employeePortalBuilderState';

async function lockPortalState(client: { query: (query: string, values?: unknown[]) => Promise<unknown> }) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [EMPLOYEE_PORTAL_SETTING_KEY]);
}

async function readPortalState(
  client: { query: (query: string, values?: unknown[]) => Promise<{ rows: Array<{ value?: string | null }> }> },
  { lock = false }: { lock?: boolean } = {},
) {
  const result = await client.query(
    `SELECT value FROM "SystemSetting" WHERE key = $1${lock ? ' FOR UPDATE' : ''}`,
    [EMPLOYEE_PORTAL_SETTING_KEY],
  );
  const rawValue = result.rows[0]?.value;

  if (!rawValue) return createDefaultCompanyPortalState();

  try {
    return parseCompanyPortalState(JSON.parse(rawValue), createDefaultCompanyPortalState());
  } catch {
    return createDefaultCompanyPortalState();
  }
}

async function writePortalState(
  client: { query: (query: string, values?: unknown[]) => Promise<unknown> },
  state: CompanyPortalState,
) {
  await client.query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [EMPLOYEE_PORTAL_SETTING_KEY, JSON.stringify(state)],
  );
}

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name || user.email || 'Portal editor';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await readPortalState(getPool());
  const liveRecords = await loadCompanyPortalLiveRecords(state.document, ['Position']);
  return NextResponse.json({
    ...state,
    canManage: hasPermission(session.user, 'COMPANY_PORTAL_MANAGE'),
    liveRecords,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'COMPANY_PORTAL_MANAGE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  const validation = bodyResult.ok
    ? saveCompanyPortalSchema.safeParse(bodyResult.value)
    : null;
  if (!validation?.success) {
    return NextResponse.json({ error: 'Invalid portal document' }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await lockPortalState(client);
    const current = await readPortalState(client, { lock: true });
    if (current.revision !== validation.data.expectedRevision) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'The portal was updated by another user. Reload before saving.', state: current },
        { status: 409 },
      );
    }

    const revision = current.revision + 1;
    const version = {
      id: randomUUID(),
      revision,
      createdAt: new Date().toISOString(),
      createdBy: getActorName(session.user),
      note: validation.data.note || 'Employee portal content updated',
      document: validation.data.document,
    };
    const nextState: CompanyPortalState = {
      revision,
      document: validation.data.document,
      versions: [version, ...current.versions].slice(0, 25),
    };

    await writePortalState(client, nextState);
    await client.query('COMMIT');
    await logAudit(
      'AUDIT',
      `Employee portal version ${revision} saved.`,
      'API:EmployeePortal:Save',
      session.user.id || null,
      { revision, note: version.note },
    );

    const liveRecords = await loadCompanyPortalLiveRecords(nextState.document, ['Position']);
    return NextResponse.json({ ...nextState, canManage: true, liveRecords });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to save employee portal:', error);
    return NextResponse.json({ error: 'Failed to save employee portal' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'COMPANY_PORTAL_MANAGE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  const validation = bodyResult.ok
    ? restoreCompanyPortalSchema.safeParse(bodyResult.value)
    : null;
  if (!validation?.success) {
    return NextResponse.json({ error: 'Invalid restore request' }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await lockPortalState(client);
    const current = await readPortalState(client, { lock: true });
    if (current.revision !== validation.data.expectedRevision) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'The portal was updated by another user. Reload before restoring.', state: current },
        { status: 409 },
      );
    }

    const sourceVersion = current.versions.find(version => version.id === validation.data.versionId);
    if (!sourceVersion) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const revision = current.revision + 1;
    const restoredVersion = {
      id: randomUUID(),
      revision,
      createdAt: new Date().toISOString(),
      createdBy: getActorName(session.user),
      note: `Restored version ${sourceVersion.revision}`,
      document: sourceVersion.document,
    };
    const nextState: CompanyPortalState = {
      revision,
      document: sourceVersion.document,
      versions: [restoredVersion, ...current.versions].slice(0, 25),
    };

    await writePortalState(client, nextState);
    await client.query('COMMIT');
    await logAudit(
      'AUDIT',
      `Employee portal version ${sourceVersion.revision} restored as version ${revision}.`,
      'API:EmployeePortal:Restore',
      session.user.id || null,
      { revision, restoredFrom: sourceVersion.revision },
    );

    const liveRecords = await loadCompanyPortalLiveRecords(nextState.document, ['Position']);
    return NextResponse.json({ ...nextState, canManage: true, liveRecords });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to restore employee portal:', error);
    return NextResponse.json({ error: 'Failed to restore employee portal' }, { status: 500 });
  } finally {
    client.release();
  }
}
