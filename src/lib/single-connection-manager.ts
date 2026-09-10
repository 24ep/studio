import { Pool, PoolClient } from 'pg';
import {
  endSingleConnectionPool,
  releaseSingleConnectionClient,
  rollbackSingleConnectionTransaction,
} from './single-connection-lifecycle';
import {
  connectSingleConnectionClient,
  createSingleConnectionPool,
} from './single-connection-factory';
import {
  buildSingleConnectionStatus,
  logSlowSingleConnectionOperation,
  startSingleConnectionKeepAlive,
} from './single-connection-manager-utils';

process.env.PG_NATIVE = 'false';

class SingleConnectionManager {
  private static instance: SingleConnectionManager;
  private pool: Pool | null = null;
  private currentClient: PoolClient | null = null;
  private isConnected = false;
  private connectionPromise: Promise<PoolClient> | null = null;
  private lastUsed = 0;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startKeepAlive();
  }

  static getInstance(): SingleConnectionManager {
    if (!SingleConnectionManager.instance) {
      SingleConnectionManager.instance = new SingleConnectionManager();
    }
    return SingleConnectionManager.instance;
  }

  private async createPool(): Promise<Pool> {
    if (this.pool) return this.pool;

    this.pool = createSingleConnectionPool({
      onPoolError: (error) => {
        console.error('[SINGLE CONNECTION] Pool error:', error);
        this.markDisconnected();
      },
    });

    return this.pool;
  }

  private async getConnection(): Promise<PoolClient> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.currentClient && this.isConnected) {
      this.lastUsed = Date.now();
      return this.currentClient;
    }

    this.connectionPromise = this.createPool().then(async (pool) => {
      try {
        const client = await connectSingleConnectionClient(pool, {
          onClientError: (error) => {
            console.error('[SINGLE CONNECTION] Client error:', error);
            this.markDisconnected();
          },
          onClientEnd: () => {
            console.log('[SINGLE CONNECTION] Client disconnected');
            this.markDisconnected();
          },
        });
        this.currentClient = client;
        this.isConnected = true;
        this.lastUsed = Date.now();
        
        console.log('[SINGLE CONNECTION] New connection established');

        return client;
      } catch (error) {
        console.error('[SINGLE CONNECTION] Failed to connect:', error);
        this.connectionPromise = null;
        throw error;
      }
    });

    return this.connectionPromise;
  }

  private startKeepAlive() {
    this.keepAliveInterval = startSingleConnectionKeepAlive({
      getClient: () => this.currentClient,
      isConnected: () => this.isConnected,
      onSuccess: () => {
        this.lastUsed = Date.now();
      },
      onFailure: (error) => {
        console.error('[SINGLE CONNECTION] Keep-alive failed:', error);
        this.markDisconnected();
      },
    });
  }

  async execute<T>(
    operation: (client: PoolClient) => Promise<T>,
    operationName: string = 'unknown'
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const client = await this.getConnection();
      
      const result = await operation(client);
      
      const duration = Date.now() - startTime;
      logSlowSingleConnectionOperation(operationName, duration);
      
      return result;
    } catch (error) {
      console.error(`[SINGLE CONNECTION] Operation '${operationName}' failed:`, error);
      
      this.markDisconnected();
      
      throw error;
    }
  }

  async executeTransaction<T>(
    operation: (client: PoolClient) => Promise<T>,
    operationName: string = 'transaction'
  ): Promise<T> {
    return this.execute(async (client) => {
      try {
        await client.query('BEGIN');
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await rollbackSingleConnectionTransaction(client);
        throw error;
      }
    }, operationName);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.execute(async (client) => {
        await client.query('SELECT 1');
      }, 'health-check');
      return true;
    } catch (error) {
      return false;
    }
  }

  getStatus() {
    return buildSingleConnectionStatus({
      isConnected: this.isConnected,
      hasClient: !!this.currentClient,
      lastUsed: this.lastUsed,
      poolSize: this.pool ? this.pool.totalCount : 0,
    });
  }

  async cleanup() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.currentClient) {
      releaseSingleConnectionClient(this.currentClient);
      this.currentClient = null;
    }

    if (this.pool) {
      await endSingleConnectionPool(this.pool);
      this.pool = null;
    }

    this.isConnected = false;
    this.connectionPromise = null;
  }

  private markDisconnected() {
    this.isConnected = false;
    this.currentClient = null;
    this.connectionPromise = null;
  }
}

export const singleConnectionManager = SingleConnectionManager.getInstance();

export async function withSingleConnection<T>(
  operation: (client: PoolClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  return singleConnectionManager.execute(operation, operationName);
}

export async function withSingleTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  return singleConnectionManager.executeTransaction(operation, operationName);
}

export async function checkSingleConnectionHealth(): Promise<boolean> {
  return singleConnectionManager.healthCheck();
}

export function getSingleConnectionStatus() {
  return singleConnectionManager.getStatus();
}

export async function cleanupSingleConnection() {
  await singleConnectionManager.cleanup();
}
