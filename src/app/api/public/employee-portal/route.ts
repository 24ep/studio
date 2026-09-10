import { NextResponse } from 'next/server';

import {
  createDefaultCompanyPortalState,
  parseCompanyPortalState,
} from '@/lib/company-portal-builder';
import { getPool } from '@/lib/db';
import { loadCompanyPortalLiveRecords } from '@/lib/company-portal-live-data';

export const dynamic = 'force-dynamic';

const EMPLOYEE_PORTAL_SETTING_KEY = 'employeePortalBuilderState';

export async function GET() {
  try {
    const result = await getPool().query<{ value?: string | null }>(
      'SELECT value FROM "SystemSetting" WHERE key = $1',
      [EMPLOYEE_PORTAL_SETTING_KEY],
    );
    const rawValue = result.rows[0]?.value;
    const state = rawValue
      ? parseCompanyPortalState(JSON.parse(rawValue))
      : createDefaultCompanyPortalState();
    const liveRecords = await loadCompanyPortalLiveRecords(state.document, ['Position']);

    return NextResponse.json({
      ...state,
      canManage: false,
      liveRecords,
    });
  } catch (error) {
    console.error('[PublicEmployeePortal] Failed to load portal:', error);
    return NextResponse.json({
      ...createDefaultCompanyPortalState(),
      canManage: false,
    });
  }
}
