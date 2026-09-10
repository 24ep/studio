import { describe, expect, it } from 'vitest';

import {
  buildUsersWhereConditionsForAccess,
  getUsersPagination,
} from './users-route-list-query-utils';

describe('users-route-list-query', () => {
  it('supports lowercase role filters and shared search queries', () => {
    const where = buildUsersWhereConditionsForAccess(
      new URLSearchParams('role=recruiter&search=Jane'),
      true
    );

    expect(where).toEqual({
      role: 'Recruiter',
      OR: [
        { name: { contains: 'Jane', mode: 'insensitive' } },
        { email: { contains: 'Jane', mode: 'insensitive' } },
      ],
    });
  });

  it('accepts limit as a pageSize alias and clamps invalid pagination', () => {
    expect(getUsersPagination(new URLSearchParams('page=2&limit=5'))).toEqual({
      page: 2,
      pageSize: 5,
      skip: 5,
    });

    expect(getUsersPagination(new URLSearchParams('page=-1&limit=bad'))).toEqual({
      page: 1,
      pageSize: 10,
      skip: 0,
    });
  });
});
