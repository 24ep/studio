import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Public endpoint: lightweight SSE proxy keepalive that does not expose user data.
export async function GET(request: NextRequest) {
  try {
    const encoder = new TextEncoder();
    let interval: NodeJS.Timeout | undefined;

    const stopKeepalive = () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const stream = new ReadableStream({
      start(controller) {
        // Immediate comment frame to flush through proxies
        try {
          controller.enqueue(encoder.encode(`: pong ${Date.now()}\n\n`));
        } catch {}

        // Periodic lightweight keepalive
        interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
          } catch {
            stopKeepalive();
          }
        }, 30000);

        request.signal.addEventListener('abort', () => {
          stopKeepalive();
        }, { once: true });
      },
      cancel() {
        stopKeepalive();
      }
    });

    // SECURITY: Use proper CORS validation instead of wildcard
    const { getAllowedOrigin } = await import('@/lib/cors');
    const allowedOrigin = getAllowedOrigin(request);
    
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Transfer-Encoding': 'identity'
    };
    
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(stream, { headers });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}


