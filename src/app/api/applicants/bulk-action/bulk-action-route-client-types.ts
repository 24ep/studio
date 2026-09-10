export interface QueryableClient {
  query: <Row = unknown>(queryText: string, values?: readonly unknown[]) => Promise<{
    rows: Row[];
    rowCount?: number | null;
  }>;
}
