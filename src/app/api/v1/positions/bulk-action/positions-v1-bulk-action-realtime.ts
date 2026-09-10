import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';
import type { V1PositionBulkAction } from './positions-v1-bulk-action-schema';

type PositionStatsRow = QueryResultRow & {
  total: string;
  open: string;
  closed: string;
};

export async function broadcastV1PositionBulkActionUpdates(
  client: DbClient,
  action: V1PositionBulkAction,
  affectedCount: number
) {
  if (affectedCount <= 0) {
    return;
  }

  try {
    const { broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } = await import('@/lib/simple-broadcaster');
    broadcastPositionListUpdated();

    if (action === 'delete') {
      const statsResult = await client.query<PositionStatsRow>(`
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
    }
  } catch (broadcastError) {
    console.error('Failed to broadcast real-time updates:', broadcastError);
  }
}
