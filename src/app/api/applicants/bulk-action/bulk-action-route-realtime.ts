import type { QueryableClient } from './bulk-action-route-utils';

type PositionStatisticsRow = {
  total: string;
  open: string;
  closed: string;
};

export async function broadcastBulkActionPositionUpdates(client: QueryableClient) {
  try {
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
      total: parseInt(stats.total, 10),
      open: parseInt(stats.open, 10),
      closed: parseInt(stats.closed, 10),
    });
  } catch (broadcastError) {
    console.error('Failed to broadcast real-time updates:', broadcastError);
  }
}
