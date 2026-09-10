import { NextRequest } from 'next/server';
import { getApiServers } from '@/lib/apiServers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify(getApiServers()), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
} 
