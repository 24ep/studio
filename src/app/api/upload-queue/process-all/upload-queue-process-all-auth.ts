import { NextResponse, type NextRequest } from 'next/server';
import { isValidProcessorApiKey } from '@/lib/processor-auth';

export function requireProcessAllApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (isValidProcessorApiKey(apiKey)) {
    return { ok: true as const };
  }

  console.warn('Unauthorized attempt to batch process upload queue with invalid API key', {
    providedKey: apiKey ? 'present' : 'missing',
  });
  return {
    ok: false as const,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
