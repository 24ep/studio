import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';

export async function logApiSecurityAudit(
  level: 'AUDIT' | 'WARN' | 'ERROR',
  message: string,
  source: string,
  userId: string | null | undefined,
  details?: Record<string, unknown>,
  warningMessage = '[API SECURITY] Audit logging failed during build:'
) {
  try {
    await logAudit(level, message, source, userId ?? null, details);
  } catch (error) {
    console.warn(warningMessage, error);
  }
}

export function serviceUnavailableDuringBuild() {
  return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 });
}
