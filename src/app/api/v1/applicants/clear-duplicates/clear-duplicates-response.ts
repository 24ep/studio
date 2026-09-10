import { NextResponse, type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function clearDuplicatesResponse(request: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: handleCors(request),
  });
}

export function clearDuplicatesErrorResponse(request: NextRequest, error: string, status: number) {
  return clearDuplicatesResponse(request, { success: false, error }, status);
}
