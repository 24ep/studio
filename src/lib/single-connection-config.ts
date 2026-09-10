import type { PoolConfig } from 'pg';

const SINGLE_CONNECTION_IDLE_TIMEOUT_MS = 5_000;
const SINGLE_CONNECTION_TIMEOUT_MS = 600_000;
const SINGLE_CONNECTION_STATEMENT_TIMEOUT_MS = 180_000;

export function buildSingleConnectionPoolConfig(databaseUrl: string): PoolConfig & { native?: boolean } {
  return {
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: SINGLE_CONNECTION_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: SINGLE_CONNECTION_TIMEOUT_MS,
    statement_timeout: SINGLE_CONNECTION_STATEMENT_TIMEOUT_MS,
    allowExitOnIdle: false,
    native: false,
  };
}
