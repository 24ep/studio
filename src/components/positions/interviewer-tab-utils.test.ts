import { describe, expect, it } from 'vitest';
import type { Interviewer, InterviewerUser } from './interviewer-tab-types';
import {
  formatInterviewerAddedDate,
  getAddInterviewersButtonLabel,
  getAvailableUsersEmptyMessage,
  getFilteredAvailableUsers,
  getFilteredInterviewers,
  getInterviewerEmptyStateCopy,
  getInterviewersSummaryLabel,
  getMobileSelectedInterviewersLabel,
  getSelectedUsers,
  isBlankEntityId,
  isValidUuid,
} from './interviewer-tab-utils';

const users: InterviewerUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'Admin',
    positionTitle: 'Engineer',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'User',
  },
];

const interviewers: Interviewer[] = [
  {
    id: 'interviewer-1',
    userId: users[0].id,
    userName: users[0].name,
    userEmail: users[0].email,
    userRole: 'Admin',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
];

describe('interviewer-tab-utils', () => {
  it('validates blank and uuid entity ids', () => {
    expect(isBlankEntityId(undefined)).toBe(true);
    expect(isBlankEntityId(null)).toBe(true);
    expect(isBlankEntityId('')).toBe(true);
    expect(isBlankEntityId('null')).toBe(true);
    expect(isBlankEntityId('undefined')).toBe(true);
    expect(isBlankEntityId(users[0].id)).toBe(false);

    expect(isValidUuid(users[0].id)).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });

  it('filters available users by assignment and search text', () => {
    expect(getFilteredAvailableUsers({ users, interviewers, searchTerm: '' })).toEqual([users[1]]);
    expect(getFilteredAvailableUsers({ users, interviewers, searchTerm: 'grace' })).toEqual([users[1]]);
    expect(getFilteredAvailableUsers({ users, interviewers, searchTerm: 'ada' })).toEqual([]);
  });

  it('selects users from selected ids', () => {
    expect(getSelectedUsers(users, new Set([users[1].id]))).toEqual([users[1]]);
  });

  it('filters assigned interviewers by name or email', () => {
    expect(getFilteredInterviewers(interviewers, 'ada')).toEqual(interviewers);
    expect(getFilteredInterviewers(interviewers, 'example.com')).toEqual(interviewers);
    expect(getFilteredInterviewers(interviewers, 'grace')).toEqual([]);
  });

  it('builds interviewer selector and action labels', () => {
    expect(getMobileSelectedInterviewersLabel(0)).toBe('Select interviewers...');
    expect(getMobileSelectedInterviewersLabel(1)).toBe('1 interviewer selected');
    expect(getMobileSelectedInterviewersLabel(2)).toBe('2 interviewers selected');

    expect(getAddInterviewersButtonLabel(1)).toBe('Add 1 Interviewer');
    expect(getAddInterviewersButtonLabel(3)).toBe('Add 3 Interviewers');
  });

  it('builds empty-state copy for available users and assigned interviewers', () => {
    expect(getAvailableUsersEmptyMessage('')).toBe('No available users.');
    expect(getAvailableUsersEmptyMessage('ada')).toBe('No users match your search.');

    expect(getInterviewerEmptyStateCopy('')).toEqual({
      title: 'No Interviewers Assigned',
      description: 'No users have been assigned as interviewers for this position yet.',
      showAddButton: true,
    });
    expect(getInterviewerEmptyStateCopy('ada')).toEqual({
      title: 'No Interviewers Assigned',
      description: 'No interviewers match your search.',
      showAddButton: false,
    });
  });

  it('builds summary labels and formats added dates', () => {
    expect(getInterviewersSummaryLabel({
      filteredCount: 1,
      totalCount: 1,
      isFiltered: false,
    })).toBe('1 of 1 interviewer');

    expect(getInterviewersSummaryLabel({
      filteredCount: 2,
      totalCount: 3,
      isFiltered: true,
    })).toBe('2 of 3 interviewers (filtered)');

    expect(formatInterviewerAddedDate('2026-06-01T00:00:00.000Z')).toBe('Jun 1, 2026');
  });
});
