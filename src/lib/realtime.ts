// Lightweight SSE hub for simple realtime broadcasting
// Maintains a global set of connections and provides minimal broadcast helpers

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const encoder = new TextEncoder();

// Global connection store (in-memory per server instance)
const connections: Set<SSEController> = new Set();

function writeEvent(controller: SSEController, event: string | undefined, data: unknown) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const eventPrefix = event ? `event: ${event}\n` : '';
  controller.enqueue(encoder.encode(`${eventPrefix}data: ${payload}\n\n`));
}

export function broadcast(data: unknown, event?: string) {
  for (const controller of connections) {
    try {
      writeEvent(controller, event, data);
    } catch (error) {
      console.error('[Realtime] Error broadcasting to connection:', error);
      connections.delete(controller);
    }
  }
}

export function getConnectionCount() {
  return connections.size;
}

export function subscribe(request: Request): Response {
  let keepalive: NodeJS.Timeout | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Add to connection set
      connections.add(controller);

      // Warm-up comment to flush through proxies
      try {
        controller.enqueue(encoder.encode(`: open ${Date.now()}\n\n`));
      } catch {}

      // Initial connected message
      writeEvent(controller, undefined, {
        type: 'connected',
        message: 'SSE connected',
        timestamp: new Date().toISOString()
      });

      // Keepalive events - reduced frequency for lower CPU/RAM usage
      // Actual data updates are pushed immediately via broadcast()
      keepalive = setInterval(() => {
        try {
          writeEvent(controller, 'keepalive', {
            type: 'keepalive',
            timestamp: new Date().toISOString()
          });
        } catch {
          if (keepalive) clearInterval(keepalive);
          connections.delete(controller);
        }
      }, 30000); // Optimized: 30s keepalive (was 1s) - actual updates push immediately

      // Cleanup on client abort
      request.signal.addEventListener('abort', () => {
        if (keepalive) clearInterval(keepalive);
        connections.delete(controller);
      });
    },
    cancel() {
      if (keepalive) clearInterval(keepalive);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    }
  });
}


