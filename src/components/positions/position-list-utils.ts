import type { Position } from '@/lib/types';

export {
  getNextPositionSortState,
  sortPositions,
} from './position-sort-utils';

type PositionWithHeadcountData = Position & {
  headcountData?: {
    total?: number;
    vacant?: number;
    filled?: number;
  };
};

export function buildPositionHeadcountMap(positions: PositionWithHeadcountData[]) {
  const headcountMap: Record<string, { total: number; vacant: number; filled: number }> = {};

  for (const position of positions) {
    if (position.headcountData) {
      headcountMap[position.id] = {
        total: position.headcountData.total || 0,
        vacant: position.headcountData.vacant || 0,
        filled: position.headcountData.filled || 0,
      };
    }
  }

  return headcountMap;
}

export function normalizePositionListResponse(data: unknown) {
  const response = data as { data?: unknown; total?: unknown } | null | undefined;
  const positions = Array.isArray(response?.data) ? response.data as PositionWithHeadcountData[] : [];
  const total = typeof response?.total === 'number' && Number.isFinite(response.total)
    ? response.total
    : 0;

  return {
    positions,
    total,
    headcountData: buildPositionHeadcountMap(positions),
  };
}

export function calculateVacantOpenPositionStats(
  positions: Array<Pick<Position, 'id' | 'isOpen'>>,
  headcountData: Record<string, { vacant: number }>
) {
  return positions.reduce((stats, position) => {
    const headcount = headcountData[position.id];
    if (!position.isOpen || !headcount) {
      return stats;
    }

    return {
      vacant: stats.vacant + headcount.vacant,
      totalOpen: stats.totalOpen + 1,
    };
  }, { vacant: 0, totalOpen: 0 });
}
