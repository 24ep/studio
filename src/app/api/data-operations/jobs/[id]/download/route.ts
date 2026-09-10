import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDataOperationDownload } from '@/lib/data-operation-queue';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const includeAllUsers = session.user.role === 'Admin' || hasPermission(session.user, 'UPLOAD_QUEUE_VIEW');
  const output = await getDataOperationDownload(id, session.user.id, includeAllUsers);
  if (!output?.data) return NextResponse.json({ error: 'Export file is not available' }, { status: 404 });
  return new NextResponse(new Uint8Array(output.data), { headers: { 'Content-Type': output.mimeType || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${(output.filename || 'export').replace(/["\r\n]/g, '_')}"` } });
}
