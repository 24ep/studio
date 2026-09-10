import type { Position } from '@/lib/types';
import type { PositionSortDirection } from './position-page-types';

type PositionSortValueResolver = (position: Position) => string;

const POSITION_SORT_VALUE_RESOLVERS: Record<string, PositionSortValueResolver> = {
  title: (position) => position.title?.toLowerCase() || '',
  department: (position) => position.department?.toLowerCase() || '',
  status: (position) => (position.isOpen ? 'open' : 'closed'),
  recruiter: (position) => position.recruiterName?.toLowerCase() || '',
};

export function getNextPositionSortState(
  currentColumn: string | null,
  currentDirection: PositionSortDirection,
  nextColumn: string | null,
  requestedDirection?: PositionSortDirection
) {
  if (!nextColumn) {
    return { sortColumn: null, sortDirection: 'asc' as PositionSortDirection };
  }

  if (currentColumn !== nextColumn || requestedDirection !== undefined && requestedDirection !== null) {
    return { sortColumn: nextColumn, sortDirection: requestedDirection || 'desc' };
  }

  if (currentDirection === 'asc') {
    return { sortColumn: nextColumn, sortDirection: 'desc' as PositionSortDirection };
  }

  if (currentDirection === 'desc') {
    return { sortColumn: nextColumn, sortDirection: null };
  }

  return { sortColumn: nextColumn, sortDirection: 'asc' as PositionSortDirection };
}

function getSortablePositionValue(position: Position, column: string) {
  return POSITION_SORT_VALUE_RESOLVERS[column]?.(position) || '';
}

function comparePositionSortValues(aValue: string, bValue: string, sortDirection: PositionSortDirection) {
  if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
  if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
  return 0;
}

export function sortPositions(
  positions: Position[],
  sortColumn: string | null,
  sortDirection: PositionSortDirection
) {
  if (!sortColumn || !sortDirection) {
    return positions;
  }

  return [...positions].sort((a, b) => comparePositionSortValues(
    getSortablePositionValue(a, sortColumn),
    getSortablePositionValue(b, sortColumn),
    sortDirection,
  ));
}
