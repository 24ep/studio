import type { Pool, PoolClient } from "pg";

interface SingleConnectionClientListeners {
  onEnd: () => void;
  onError: (error: Error) => void;
}

export function attachSingleConnectionClientListeners(
  client: PoolClient,
  listeners: SingleConnectionClientListeners,
) {
  client.on("error", listeners.onError);
  client.on("end", listeners.onEnd);
}

export async function rollbackSingleConnectionTransaction(client: PoolClient) {
  try {
    await client.query("ROLLBACK");
  } catch (rollbackError) {
    console.error("[SINGLE CONNECTION] Rollback failed:", rollbackError);
  }
}

export function releaseSingleConnectionClient(client: PoolClient) {
  try {
    client.release();
  } catch (error) {
    console.error("[SINGLE CONNECTION] Error releasing client:", error);
  }
}

export async function endSingleConnectionPool(pool: Pool) {
  try {
    await pool.end();
  } catch (error) {
    console.error("[SINGLE CONNECTION] Error ending pool:", error);
  }
}
