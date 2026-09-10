import { describe, expect, it } from 'vitest';
import type { Position } from '@/lib/types';
import {
  filterOpenPositions,
  filterPositionSelectOptions,
  getPositionSelectDescription,
  getPositionUpdateAction,
} from './position-select-dropdown-utils';

const positions = [
  { id: 'p1', title: 'Frontend Engineer', department: 'Product', positionLevel: 'Senior', isOpen: true },
  { id: 'p2', title: 'Account Manager', department: 'Sales', positionLevel: null, isOpen: false },
] as Position[];

describe('position-select-dropdown-utils', () => {
  it('reads position update actions from SSE event data', () => {
    expect(getPositionUpdateAction({ type: 'position_update', data: { action: 'list_updated' }, timestamp: 'now' })).toBe('list_updated');
    expect(getPositionUpdateAction({ type: 'position_update', data: null, timestamp: 'now' })).toBeNull();
    expect(getPositionUpdateAction({ type: 'other', data: { action: 'list_updated' }, timestamp: 'now' })).toBeNull();
  });

  it('filters positions by search text and open status', () => {
    expect(filterPositionSelectOptions(positions, 'senior').map(position => position.id)).toEqual(['p1']);
    expect(filterPositionSelectOptions(positions, 'sales').map(position => position.id)).toEqual(['p2']);
    expect(filterOpenPositions(positions, true).map(position => position.id)).toEqual(['p1']);
    expect(filterOpenPositions(positions, false)).toBe(positions);
  });

  it('builds readable position descriptions without corrupted separators', () => {
    expect(getPositionSelectDescription(positions[0])).toBe('Product - Senior');
    expect(getPositionSelectDescription(positions[1])).toBe('Sales');
  });
});
