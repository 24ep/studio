import type { DbClient } from './position-bulk-action-data';

type PositionStatisticsRow = {
  total: string;
  open: string;
  closed: string;
};

export async function broadcastPositionBulkActionUpdates(
  client: DbClient,
  input: {
    action: string;
    successCount: number;
    cacheInvalidated: boolean;
  }
) {
  if (!input.cacheInvalidated || input.action !== 'delete' || input.successCount <= 0) {
    return;
  }

  const { broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } = await import('@/lib/simple-broadcaster');
  broadcastPositionListUpdated();

  const statsResult = await client.query<PositionStatisticsRow>(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN "isOpen" = TRUE THEN 1 END) as open,
      COUNT(CASE WHEN "isOpen" = FALSE THEN 1 END) as closed
    FROM "Position"
  `);
  const stats = statsResult.rows[0];
  broadcastPositionStatisticsUpdated({
    total: Number.parseInt(stats.total, 10),
    open: Number.parseInt(stats.open, 10),
    closed: Number.parseInt(stats.closed, 10),
  });
}
