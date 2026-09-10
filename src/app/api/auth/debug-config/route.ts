import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/api-route-guards';
import { buildAuthDebugResponse } from './auth-debug-config-utils';

export async function GET() {
  try {
    const { response } = await requireApiPermission('SYSTEM_SETTINGS_VIEW');
    if (response) return response;

    return NextResponse.json(buildAuthDebugResponse(process.env));
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
