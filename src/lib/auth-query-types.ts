export interface AuthQueryResult<T> {
  rows: T[];
  rowCount?: number | null;
}

export interface AuthQueryClient {
  query: <T = Record<string, unknown>>(queryText: string, values?: unknown[]) => Promise<AuthQueryResult<T>>;
}
