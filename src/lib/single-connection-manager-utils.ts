import type { PoolClient } from 'pg';

export const SINGLE_CONNECTION_KEEP_ALIVE_INTERVAL_MS = 30_000;
export const SINGLE_CONNECTION_SLOW_OPERATION_MS = 1_000;

export interface SingleConnectionStatusInput {
  isConnected: boolean;
  hasClient: boolean;
  lastUsed: number;
  poolSize: number;
}

export function isSlowSingleConnectionOperation(
  durationMs: number,
  thresholdMs = SINGLE_CONNECTION_SLOW_OPERATION_MS,
): boolean {
  return durationMs > thresholdMs;
}

export function buildSingleConnectionStatus(
  input: SingleConnectionStatusInput,
  now = Date.now(),
) {
  return {
    isConnected: input.isConnected,
    hasClient: input.hasClient,
    lastUsed: input.lastUsed,
    idleSeconds: Math.round((now - input.lastUsed) / 1000),
    poolSize: input.poolSize,
  };
}

export interface SingleConnectionKeepAliveInput {
  getClient: () => PoolClient | null;
  isConnected: () => boolean;
  onFailure: (error: unknown) => void;
  onSuccess: () => void;
  intervalMs?: number;
}

export function startSingleConnectionKeepAlive({
  getClient,
  isConnected,
  onFailure,
  onSuccess,
  intervalMs = SINGLE_CONNECTION_KEEP_ALIVE_INTERVAL_MS,
}: SingleConnectionKeepAliveInput) {
  return setInterval(async () => {
    const client = getClient();
    if (!client || !isConnected()) {
      return;
    }

    try {
      await client.query('SELECT 1');
      onSuccess();
    } catch (error) {
      onFailure(error);
    }
  }, intervalMs);
}

export function logSlowSingleConnectionOperation(operationName: string, durationMs: number) {
  if (isSlowSingleConnectionOperation(durationMs)) {
    console.warn(`[SINGLE CONNECTION] Slow operation '${operationName}': ${durationMs}ms`);
  }
}
