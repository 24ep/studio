import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Lazy load swagger spec only when requested
  const swaggerSpec = await import('@/swagger').then(m => m.default);
  
  return new Response(JSON.stringify(swaggerSpec, null, 2), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 