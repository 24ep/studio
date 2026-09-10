export async function broadcastHeadcountPositionUpdates() {
  try {
    const { broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } = await import('@/lib/simple-broadcaster');

    broadcastPositionListUpdated();
    broadcastPositionStatisticsUpdated(await getPositionStatistics());
  } catch (broadcastError) {
    console.error('Failed to broadcast real-time updates:', broadcastError);
  }
}

async function getPositionStatistics() {
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

  return {
    total: parseInt(stats.total, 10),
    open: parseInt(stats.open, 10),
    closed: parseInt(stats.closed, 10),
  };
}
