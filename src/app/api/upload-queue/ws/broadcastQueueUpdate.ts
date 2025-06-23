import { getPool } from '@/lib/db';
import { clients } from './clients';

// This Set must be shared with the route file to work for live WebSocket updates.
// If you need to broadcast to all clients, you must ensure the Set is shared (e.g., via a singleton or module scope).
// For now, this function is provided as-is for code correctness.

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