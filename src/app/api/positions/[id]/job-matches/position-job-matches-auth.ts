import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function requirePositionJobMatchesSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}
