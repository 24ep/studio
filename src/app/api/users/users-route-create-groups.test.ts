import { describe, expect, it } from 'vitest';

import { getCreateUserRoleFromGroupName } from './users-route-create-role-utils';

describe('users route create groups', () => {
  it('derives the broad app role from group names', () => {
    expect(getCreateUserRoleFromGroupName('Platform Admin')).toBe('Admin');
    expect(getCreateUserRoleFromGroupName('Hiring Team Manager')).toBe('Hiring Manager');
    expect(getCreateUserRoleFromGroupName('Recruiting Operations')).toBe('Recruiter');
  });
});
