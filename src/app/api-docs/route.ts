import { NextRequest } from 'next/server';
import { getAllowedOrigin } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  // SECURITY: Use proper CORS validation instead of wildcard
  const allowedOrigin = getAllowedOrigin(req);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return new Response(null, {
    status: 200,
    headers,
  });
}

export async function GET(req: NextRequest) {
  try {
    // Lazy load swagger spec only when requested
    const swaggerSpec = await import('@/swagger/index').then(m => m.default);
    
    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(req);
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(JSON.stringify(swaggerSpec, null, 2), { headers });
  } catch (error) {
    console.error('API Docs: Failed to load swagger spec:', error);
    
    // SECURITY: Never expose detailed error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(req);
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to load API documentation',
      ...(isDevelopment && { details: error instanceof Error ? error.message : String(error) }),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers,
    });
  }
} 
