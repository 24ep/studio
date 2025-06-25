const WebSocket = require('ws');
const { createClient } = require('redis');

const PORT = process.env.WS_QUEUE_BRIDGE_PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ALLOWED_ORIGINS = (process.env.WS_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const wss = new WebSocket.Server({ port: PORT });
const redis = createClient({ url: REDIS_URL });

redis.connect().then(() => {
  console.log('Connected to Redis for WebSocket bridge');
  redis.subscribe('candidate_upload_queue', (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }
  console.log('WebSocket client connected:', origin);
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

console.log(`WebSocket bridge server running on ws://localhost:${PORT}`); 