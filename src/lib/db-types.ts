import type { QueryResult, QueryResultRow } from 'pg';

export type DbClient = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<QueryResult<T>>;
  release: () => void;
};

export type ConnectionUsage = {
  lastUsed: number;
  queryCount: number;
};

export type ConnectionUsageStats = {
  totalCount: number;
  activeCount: number;
  idleCount: number;
  waitingCount: number;
  usagePercent: number;
  maxConnections: number;
};
