import { describe, expect, it } from 'vitest';
import type { TaskboardQueryParts } from './taskboard-applicants-types';
import {
  appendTaskboardMappedStatusFilter,
  appendTaskboardNullableSelectionFilter,
  appendTaskboardSingleOrArrayFilter,
} from './taskboard-applicants-query-utils';

function createParts(): TaskboardQueryParts {
  return { whereClauses: [], queryParams: [], paramIndex: 1 };
}

describe('taskboard-applicants-query-utils', () => {
  it('appends single and array filters with stable placeholders', () => {
    const parts = createParts();

    appendTaskboardSingleOrArrayFilter(parts, 'c."positionId"', ['position-1']);
    appendTaskboardSingleOrArrayFilter(parts, 'c."positionId"', ['position-2', 'position-3']);

    expect(parts).toEqual({
      whereClauses: ['c."positionId" = $1', 'c."positionId" = ANY($2::uuid[])'],
      queryParams: ['position-1', ['position-2', 'position-3']],
      paramIndex: 3,
    });
  });

  it('appends nullable selection filters', () => {
    const parts = createParts();

    appendTaskboardNullableSelectionFilter(parts, ['unassigned', 'user-1'], {
      nullCondition: 'c."recruiterId" IS NULL',
      arrayCondition: (placeholder) => `c."recruiterId" = ANY(${placeholder}::uuid[])`,
      nullOrArrayCondition: (placeholder) => `(c."recruiterId" IS NULL OR c."recruiterId" = ANY(${placeholder}::uuid[]))`,
    });

    expect(parts).toEqual({
      whereClauses: ['(c."recruiterId" IS NULL OR c."recruiterId" = ANY($1::uuid[]))'],
      queryParams: [['user-1']],
      paramIndex: 2,
    });
  });

  it('appends mapped status filters when present', () => {
    const parts = createParts();

    appendTaskboardMappedStatusFilter(parts, 'assigned', {
      assigned: 'c."recruiterId" IS NOT NULL',
      unassigned: 'c."recruiterId" IS NULL',
    });
    appendTaskboardMappedStatusFilter(parts, 'unknown', {
      assigned: 'c."recruiterId" IS NOT NULL',
    });

    expect(parts.whereClauses).toEqual(['c."recruiterId" IS NOT NULL']);
  });
});
