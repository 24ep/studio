import { NextRequest } from 'next/server';
import swaggerSpec from '@/swagger';

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify(swaggerSpec, null, 2), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 