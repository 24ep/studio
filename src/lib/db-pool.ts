import { Pool, type PoolClient, type PoolConfig } from 'pg';

import { isBuildTime } from './build-check';
import { addProcessHandler } from './process-manager';
import type { ConnectionUsage, ConnectionUsageStats } from './db-types';
import { buildPoolConfig as buildDatabasePoolConfig } from './database-connection';

process.env.PG_NATIVE = 'false';

const OLD_CONNECTION_IDLE_MS = 5 * 60 * 1000;
const EMERGENCY_IDLE_MS = 2 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_POOL_MAX_CONNECTIONS = 50;
const DEFAULT_IDLE_TIMEOUT_MS = 10_000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 300_000;
export const DEFAULT_STATEMENT_TIMEOUT_MS = 120_000;

let pool: Pool | null = null;
let poolMonitorInterval: NodeJS.Timeout | null = null;
let shutdownHandlerAdded = false;

const connectionUsageTracker = new Map<PoolClient, ConnectionUsage>();

// No-op by default in environments that don't initialize a pool yet.

export function trackConnectionUsage(client: PoolClient) {
  const existing = connectionUsageTracker.get(client);
  if (existing) {
    existing.lastUsed = Date.now();
    existing.queryCount++;
    return;
  }

  connectionUsageTracker.set(client, { lastUsed: Date.now(), queryCount: 1 });
}

export function forgetTrackedConnection(client: PoolClient) {
  connectionUsageTracker.delete(client);
}

export async function emergencyConnectionCleanup() {
  if (!pool) {
    return { success: false, message: 'No active pool' };
  }

  try {
    const beforeStats = buildConnectionUsageStats(pool);
    const cleanedConnections = await releaseIdleClients(pool, beforeStats.idleCount);

    cleanupTrackedConnections(EMERGENCY_IDLE_MS);

    const afterStats = getConnectionUsageStats();
    return {
      success: true,
      cleanedConnections,
      beforeStats,
      afterStats,
      message: `Cleaned up ${cleanedConnections} connections. Usage: ${afterStats?.usagePercent}%`,
    };
  } catch (error) {
    console.error('[DB POOL] Error during emergency cleanup:', error);
    return { success: false, message: `Error: ${error}` };
  }
}

export function getConnectionUsageStats(): ConnectionUsageStats | null {
  if (!pool) {
    return null;
  }

  return buildConnectionUsageStats(pool);
}

export function getPool(): Pool {
  if (isBuildTime()) {
    return createBuildTimePool();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('FATAL: DATABASE_URL environment variable is not set.');
  }

  if (!pool) {
    pool = new Pool(buildPoolConfig(databaseUrl));
    pool.on('error', (error) => {
      console.error('Unexpected error on idle PostgreSQL client', error);
    });

    startPoolMonitoring();
    registerShutdownHandler();
  }

  return pool;
}

function cleanupOldConnections() {
  cleanupTrackedConnections(OLD_CONNECTION_IDLE_MS, true);
}

function cleanupTrackedConnections(maxIdleTime: number, releaseClient = false) {
  const now = Date.now();

  for (const [client, usage] of connectionUsageTracker.entries()) {
    if (now - usage.lastUsed <= maxIdleTime) {
      continue;
    }

    try {
      if (releaseClient) {
        client.release();
      }
    } catch (error) {
      console.error('[DB CLEANUP] Error closing old connection:', error);
    } finally {
      connectionUsageTracker.delete(client);
    }
  }
}

async function releaseIdleClients(activePool: Pool, idleCount: number) {
  let cleanedConnections = 0;
  const idleClientPromises = Array.from(
    { length: Math.min(idleCount, 10) },
    () => activePool.connect(),
  );

  for (const clientPromise of idleClientPromises) {
    try {
      const client = await clientPromise;
      client.release();
      cleanedConnections++;
    } catch (error) {
      console.error('[DB POOL] Error releasing idle client:', error);
    }
  }

  return cleanedConnections;
}

function buildConnectionUsageStats(activePool: Pool): ConnectionUsageStats {
  const { totalCount, idleCount, waitingCount } = activePool;

  return {
    totalCount,
    activeCount: totalCount - idleCount,
    idleCount,
    waitingCount,
    usagePercent: Math.round((totalCount / DEFAULT_POOL_MAX_CONNECTIONS) * 100),
    maxConnections: DEFAULT_POOL_MAX_CONNECTIONS,
  };
}

function buildPoolConfig(databaseUrl: string): PoolConfig {
  const connectionConfig = buildDatabasePoolConfig(databaseUrl);

  return {
    ...connectionConfig,
    connectionString: connectionConfig.connectionString,
    max: DEFAULT_POOL_MAX_CONNECTIONS,
    idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
    statement_timeout: DEFAULT_STATEMENT_TIMEOUT_MS,
    allowExitOnIdle: true,
  };
}

function startPoolMonitoring() {
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
    poolMonitorInterval = null;
  }

  poolMonitorInterval = setInterval(cleanupOldConnections, CLEANUP_INTERVAL_MS);
  poolMonitorInterval.unref?.();
}

function registerShutdownHandler() {
  if (shutdownHandlerAdded) {
    return;
  }

  shutdownHandlerAdded = true;
  addProcessHandler('SIGINT', shutdownPool, 'db-pool-shutdown');
  addProcessHandler('SIGTERM', shutdownPool, 'db-pool-shutdown');
}

async function shutdownPool() {
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
    poolMonitorInterval = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
}

function createBuildTimePool(): Pool {
  return {
    connect: async () => {
      throw new Error('Database connections are not available during build time');
    },
    query: async () => {
      throw new Error('Database queries are not available during build time');
    },
    end: async () => undefined,
  } as unknown as Pool;
}
