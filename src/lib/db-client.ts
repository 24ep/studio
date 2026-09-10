import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

import {
  DEFAULT_STATEMENT_TIMEOUT_MS,
  forgetTrackedConnection,
  getPool,
  trackConnectionUsage,
} from './db-pool';
import type { DbClient } from './db-types';

type StatementTimeoutClient = {
  query: (text: string) => Promise<unknown>;
};

export async function restoreDefaultStatementTimeout(client: StatementTimeoutClient) {
  await client.query(`SET statement_timeout = ${DEFAULT_STATEMENT_TIMEOUT_MS}`);
}

export class SafeClient implements DbClient {
  private client: PoolClient;
  private released = false;

  constructor(client: PoolClient) {
    this.client = client;
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    if (this.released) {
      throw new Error('Cannot use client after it has been released');
    }

    trackConnectionUsage(this.client);
    return this.client.query<T>(text, params);
  }

  release() {
    if (this.released) {
      return;
    }

    this.released = true;
    forgetTrackedConnection(this.client);
    this.client.release();
  }

  isReleased() {
    return this.released;
  }
}

export async function getSafeDbClient() {
  const client = await getPool().connect();
  return new SafeClient(client);
}

export async function withDbClient<T>(
  operation: (client: SafeClient) => Promise<T>,
): Promise<T> {
  const client = await getSafeDbClient();
  try {
    return await operation(client);
  } finally {
    client.release();
  }
}

export async function withDbTransaction<T>(
  operation: (client: SafeClient) => Promise<T>,
): Promise<T> {
  const client = await getSafeDbClient();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
