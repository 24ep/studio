// src/app/api/settings/system-settings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import { handleGetSystemSettings } from './system-settings-route-get';
import { handleSaveSystemSettings } from './system-settings-route-save';
import { handleUploadSystemSettingsImage } from './system-settings-route-upload';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleGetSystemSettings(request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to update system settings by user ${session?.user?.email || 'Unknown'}.`,
      'API:SystemSettings:Update',
      session?.user?.id
    );
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return handleSaveSystemSettings(request, session);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to upload settings image by user ${session?.user?.email || 'Unknown'}.`,
      'API:SystemSettings:UploadImage',
      session?.user?.id
    );
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return handleUploadSystemSettingsImage(request);
}
