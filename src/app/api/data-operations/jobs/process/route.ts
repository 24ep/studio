import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processDataOperationQueue } from '@/lib/data-operation-queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'Admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  await processDataOperationQueue();
  return NextResponse.json({ ok: true });
}
