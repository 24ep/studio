import { NextResponse, type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';

export async function requireUploadQueueV1User(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized - Bearer token required' }, { status: 401 }),
    };
  }

  const token = authHeader.split(' ')[1];
  const user = await verifyApiToken(token);
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized - Invalid or expired token' }, { status: 401 }),
    };
  }

  return { ok: true as const, user };
}
