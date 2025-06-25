import { getPool } from '@/lib/db';
const clients = new Set();
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
export async function GET(request) {
    const { webSocket } = request;
    if (!webSocket) {
        return new Response('Expected websocket', { status: 426 });
    }
    webSocket.accept();
    clients.add(webSocket);
    webSocket.addEventListener('close', () => clients.delete(webSocket));
    webSocket.addEventListener('error', () => clients.delete(webSocket));
    await sendQueue(webSocket);
    return new Response(null, { status: 101 });
}
async function sendQueue(socket) {
    const client = await getPool().connect();
    try {
        const res = await client.query('SELECT * FROM upload_queue ORDER BY upload_date DESC');
        socket.send(JSON.stringify({ type: 'queue', data: res.rows }));
    }
    finally {
        client.release();
    }
}
