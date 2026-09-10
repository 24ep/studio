/**
 * Headcount Broadcast Utilities
 * Shared broadcast functions for position updates
 */

import { broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } from '@/lib/simple-broadcaster';

/**
 * Broadcast position statistics update to SSE clients
 */
export async function broadcastPositionStats(): Promise<void> {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "isOpen" = TRUE THEN 1 END) as open,
        COUNT(CASE WHEN "isOpen" = FALSE THEN 1 END) as closed
      FROM "Position"
    `;
    const { getPool } = await import('@/lib/db');
    const statsResult = await getPool().query(statsQuery);
    const stats = statsResult.rows[0];
    const statistics = {
      total: parseInt(stats.total, 10),
      open: parseInt(stats.open, 10),
      closed: parseInt(stats.closed, 10)
    };
    broadcastPositionStatisticsUpdated(statistics);
  } catch (error) {
    console.error('Failed to broadcast position statistics:', error);
  }
}

/**
 * Broadcast position list and statistics updates
 */
export async function broadcastPositionUpdates(): Promise<void> {
  try {
    broadcastPositionListUpdated();
    await broadcastPositionStats();
  } catch (error) {
    console.error('Failed to broadcast position updates:', error);
  }
}
