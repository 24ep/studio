import { NextResponse } from 'next/server';

import {
  createDefaultJobPortalState,
  parseCompanyPortalState,
} from '@/lib/company-portal-builder';
import { getPool } from '@/lib/db';
import { loadCompanyPortalLiveRecords } from '@/lib/company-portal-live-data';

export const dynamic = 'force-dynamic';

const JOB_PORTAL_SETTING_KEY = 'companyPortalBuilderState';

export async function GET() {
  try {
    const result = await getPool().query<{ value?: string | null }>(
      'SELECT value FROM "SystemSetting" WHERE key = $1',
      [JOB_PORTAL_SETTING_KEY],
    );
    const rawValue = result.rows[0]?.value;
    const state = rawValue
      ? parseCompanyPortalState(JSON.parse(rawValue), createDefaultJobPortalState())
      : createDefaultJobPortalState();
    const liveRecords = await loadCompanyPortalLiveRecords(state.document, ['Position']);

    return NextResponse.json({ ...state, canManage: false, liveRecords });
  } catch (error) {
    console.error('[PublicJobPortal] Failed to load portal:', error);
    return NextResponse.json({ ...createDefaultJobPortalState(), canManage: false });
  }
}
