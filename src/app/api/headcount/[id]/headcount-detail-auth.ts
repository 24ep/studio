import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function requireHeadcountDetailSession() {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export function getHeadcountActorName(user: { name?: string | null; email?: string | null }) {
  return user.name || user.email || 'System';
}
