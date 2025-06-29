import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('API Docs: Loading swagger specification...');
    // Lazy load swagger spec only when requested
    const swaggerSpec = await import('@/swagger').then(m => m.default);
    console.log('API Docs: Swagger spec loaded successfully');
    return new Response(JSON.stringify(swaggerSpec, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
    });
  } catch (error) {
    console.error('API Docs: Failed to load swagger spec:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load API documentation', 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 