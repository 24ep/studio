import type { SSEEvent } from '@/hooks/use-shared-sse';
import type { Position } from '@/lib/types';

interface PositionUpdatePayload {
  action?: string;
}

export function getPositionUpdateAction(event: SSEEvent) {
  if (event.type !== 'position_update' || typeof event.data !== 'object' || event.data === null) {
    return null;
  }

  return (event.data as PositionUpdatePayload).action || null;
}

export function filterPositionSelectOptions(
  positions: Position[],
  searchTerm: string
) {
  const query = searchTerm.toLowerCase();
  return positions.filter(position => (
    position.title?.toLowerCase().includes(query) ||
    position.department?.toLowerCase().includes(query) ||
    position.positionLevel?.toLowerCase().includes(query)
  ));
}

export function filterOpenPositions(positions: Position[], filterOpenOnly: boolean) {
  return filterOpenOnly ? positions.filter(position => position.isOpen) : positions;
}

export function getPositionSelectDescription(position: Pick<Position, 'department' | 'positionLevel'>) {
  return [position.department, position.positionLevel].filter(Boolean).join(' - ');
}
