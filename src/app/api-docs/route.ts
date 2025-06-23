import swaggerSpec from '../../swagger';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify(swaggerSpec), {
    headers: { 'Content-Type': 'application/json' },
  });
} 