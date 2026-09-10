import { describe, expect, it } from 'vitest';
import {
  buildPositionListQuery,
  getPositionPaginationUpdateFromSearch,
  parsePositionRecruiterFromSearch,
  parsePositionStatusFromSearch,
} from './position-page-query-utils';

describe('position-page-query-utils', () => {
  it('parses status from explicit status and query parameters', () => {
    expect(parsePositionStatusFromSearch('?status=open')).toBe('open');
    expect(parsePositionStatusFromSearch('?query=status:closed')).toBe('closed');
    expect(parsePositionStatusFromSearch('?status=other', 'open')).toBe('open');
  });

  it('normalizes recruiter and pagination values from search params', () => {
    expect(parsePositionRecruiterFromSearch('?recruiterId=all', 'abc')).toBeNull();
    expect(parsePositionRecruiterFromSearch('?recruiterId=rec-1')).toBe('rec-1');
    expect(getPositionPaginationUpdateFromSearch('?page=3&pageSize=50', 1, 20)).toEqual({
      page: 3,
      pageSize: 50,
      shouldUpdatePage: true,
      shouldUpdatePageSize: true,
    });
  });

  it('builds position list API queries from filters', () => {
    const query = buildPositionListQuery({
      searchTerm: 'designer',
      statusFilter: 'open',
      departmentFilter: 'Product',
      gradeFilter: 'grade-1',
      selectedRecruiterId: 'unassigned',
      selectedHiringManagerId: 'manager-1',
      page: 2,
      pageSize: 25,
    });

    expect(query.get('title')).toBe('designer');
    expect(query.get('isOpen')).toBe('true');
    expect(query.get('recruiterId')).toBe('null');
    expect(query.get('offset')).toBe('25');
    expect(query.get('includeHeadcount')).toBe('true');
  });
});
