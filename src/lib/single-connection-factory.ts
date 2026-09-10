import { Pool, type PoolClient } from 'pg';

import { buildSingleConnectionPoolConfig } from './single-connection-config';
import { attachSingleConnectionClientListeners } from './single-connection-lifecycle';

interface CreateSingleConnectionPoolOptions {
  onPoolError: (error: Error) => void;
}

interface ConnectSingleConnectionClientOptions {
  onClientEnd: () => void;
  onClientError: (error: Error) => void;
}

export function createSingleConnectionPool({ onPoolError }: CreateSingleConnectionPoolOptions) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('FATAL: DATABASE_URL environment variable is not set.');
  }

  const pool = new Pool(buildSingleConnectionPoolConfig(databaseUrl));
  pool.on('error', onPoolError);
  return pool;
}

export async function connectSingleConnectionClient(
  pool: Pool,
  listeners: ConnectSingleConnectionClientOptions
): Promise<PoolClient> {
  const client = await pool.connect();
  attachSingleConnectionClientListeners(client, {
    onError: listeners.onClientError,
    onEnd: listeners.onClientEnd,
  });
  return client;
}
