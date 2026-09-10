// In-memory list of connected clients (for demo; use a better store in production)
type DashboardStreamClient = {
  write: (chunk: Uint8Array) => void;
};

const clients: DashboardStreamClient[] = [];

export function broadcastDashboardUpdate(data: unknown) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(new TextEncoder().encode(payload));
  }
}

export { clients }; 
