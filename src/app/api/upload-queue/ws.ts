import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

const clients = new Set<WebSocket>();

/**
 * @openapi
 * /api/upload-queue/ws:
 *   get:
 *     summary: WebSocket for real-time upload queue updates
 *     description: |
 *       Upgrade to a WebSocket connection to receive real-time updates about the upload queue. Not available for Try it out in Swagger UI.
 *       
 *       **Message format:**
 *       ```json
 *       { "type": "queue", "data": [ ... ] }
 *       ```
 *     responses:
 *       426:
 *         description: Expected websocket upgrade
 */
export async function GET(request: NextRequest) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected websocket', { status: 426 });
  }
  const { socket, response } = Deno.upgradeWebSocket(request);
  clients.add(socket);
  socket.onopen = async () => {
    await sendQueue(socket);
  };
  socket.onclose = () => {
    clients.delete(socket);
  };
  socket.onerror = () => {
    clients.delete(socket);
  };
  return response;
}

async function sendQueue(socket: WebSocket) {
  const client = await getPool().connect();
  try {
    const res = await client.query('SELECT * FROM upload_queue ORDER BY upload_date DESC');
    socket.send(JSON.stringify({ type: 'queue', data: res.rows }));
  } finally {
    client.release();
  }
}

export async function broadcastQueueUpdate() {
  const client = await getPool().connect();
  try {
    const res = await client.query('SELECT * FROM upload_queue ORDER BY upload_date DESC');
    const data = JSON.stringify({ type: 'queue', data: res.rows });
    for (const ws of clients) {
      try {
        ws.send(data);
      } catch {}
    }
  } finally {
    client.release();
  }
} 