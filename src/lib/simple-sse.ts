// Simple SSE Implementation - Easy to manage and understand
// Follows best practices without over-engineering

import { auth } from '@/auth';
import type { EventPayload } from './realtime-event-types';

// Simple connection store
const connections = new Map<string, ReadableStreamDefaultController>();
const SSE_MAX_LIFETIME_MS = 14 * 60 * 1000;

// Event types
export type SSEEventType = 
  | 'Applicant_update'
  | 'position_update'
  | 'notification'
  | 'upload_queue_update'
  | 'dashboard_update'
  | 'keepalive';

// Simple event interface
export interface SSEEvent {
  type: SSEEventType;
  data: EventPayload;
  timestamp: string;
  targetUserId?: string;
}

// Simple broadcast function
export function broadcastEvent(event: SSEEvent) {
  const encoder = new TextEncoder();
  const message = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  const encodedMessage = encoder.encode(message);

  if (event.targetUserId) {
    // Send to specific user
    const controller = connections.get(event.targetUserId);
    if (controller) {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        console.error(`Failed to send ${event.type} to user ${event.targetUserId}:`, error);
        connections.delete(event.targetUserId!);
      }
    }
  } else {
    // Broadcast to all users
    for (const [userId, controller] of connections.entries()) {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        console.error(`Failed to broadcast ${event.type} to user ${userId}:`, error);
        connections.delete(userId);
      }
    }
  }
}

// Convenience functions
export function broadcastToUser(userId: string, eventType: SSEEventType, data: EventPayload) {
  broadcastEvent({
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
    targetUserId: userId
  });
}

export function broadcastToAll(eventType: SSEEventType, data: EventPayload) {
  broadcastEvent({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
}

// Connection management
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

export function removeConnection(userId: string) {
  connections.delete(userId);
}

// Get connection stats
export function getConnectionStats() {
  return {
    totalConnections: connections.size,
    connectedUsers: Array.from(connections.keys())
  };
}

// SSE Route Handler
export async function handleSSEConnection(request: Request) {
  
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }


    const encoder = new TextEncoder();
    let keepaliveInterval: NodeJS.Timeout;
    let lifetimeTimeout: NodeJS.Timeout;
    let connectionStartTime = Date.now();
    let cleanedUp = false;
    let activeController: ReadableStreamDefaultController | null = null;

    const stream = new ReadableStream({
      start(controller) {
        activeController = controller;
        const cleanup = () => {
          if (cleanedUp) {
            return;
          }
          cleanedUp = true;
          clearInterval(keepaliveInterval);
          clearTimeout(lifetimeTimeout);

          // Only remove this connection if it has not already been replaced by
          // a newer connection for the same user.
          if (connections.get(userId) === controller) {
            removeConnection(userId);
          }
        };
        
        // Add connection
        addConnection(userId, controller);

        // Send initial connection confirmation
        const initialData = JSON.stringify({
          type: 'connected',
          message: 'SSE connection established',
          timestamp: new Date().toISOString(),
          userId,
          connectionId: `${userId}-${Date.now()}`
        });
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

        // Send keepalive every 30 seconds - reduced frequency for lower CPU/RAM usage
        // Actual data updates are pushed immediately via broadcastEvent
        keepaliveInterval = setInterval(() => {
          try {
            const keepaliveData = JSON.stringify({
              type: 'keepalive',
              timestamp: new Date().toISOString(),
              uptime: Date.now() - connectionStartTime
            });
            controller.enqueue(encoder.encode(`event: keepalive\ndata: ${keepaliveData}\n\n`));
          } catch (error) {
            cleanup();
          }
        }, 30000); // Optimized: 30s keepalive (was 500ms) - actual updates push immediately

        // Railway has a hard 15-minute request limit. Close cleanly before the
        // proxy aborts the HTTP/2 stream; EventSource will reconnect.
        lifetimeTimeout = setTimeout(() => {
          cleanup();
          try {
            controller.close();
          } catch {
            // The client may have disconnected at the same moment.
          }
        }, SSE_MAX_LIFETIME_MS);

        // Cleanup on connection close
        request.signal.addEventListener('abort', () => {
          cleanup();
        });
      },
      cancel() {
        clearInterval(keepaliveInterval);
        clearTimeout(lifetimeTimeout);
        // A reconnect may already have replaced this user's controller.
        if (activeController && connections.get(userId) === activeController) {
          removeConnection(userId);
        }
      }
    });


    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
