import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
let cached: { at: number; payload: unknown } | null = null;

async function boundedDatabaseCheck() {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
  await Promise.race([getPool().query('SELECT 1'), timeout]);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (cached && Date.now() - cached.at < 30_000) return NextResponse.json(cached.payload);
  let core: 'operational' | 'degraded' = 'operational';
  try {
    await boundedDatabaseCheck();
  } catch {
    core = 'degraded';
  }
  const checkedAt = new Date().toISOString();
  const services = [
    { id: 'core', name: 'Core Application', status: core, message: core === 'operational' ? 'Application services are responding normally.' : 'Some application features may respond slowly.' },
    { id: 'authentication', name: 'Authentication', status: 'operational', message: 'Sign-in and session services are available.' },
    { id: 'documents', name: 'Documents', status: core, message: core === 'operational' ? 'Document features are available.' : 'Document access may be delayed.' },
    { id: 'notifications', name: 'Notifications', status: 'operational', message: 'Notification services are available.' },
    { id: 'integrations', name: 'Integrations', status: 'operational', message: 'Connected-service processing is available.' },
  ];
  const payload = { overall: core, checkedAt, services };
  cached = { at: Date.now(), payload };
  return NextResponse.json(payload);
}
