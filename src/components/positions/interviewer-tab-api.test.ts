import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addPositionInterviewers,
  fetchAvailableInterviewerUsers,
  removePositionInterviewer,
} from './interviewer-tab-api';
import type { InterviewerUser } from './interviewer-tab-types';

const positionId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('interviewer-tab-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads available users from the users API response', async () => {
    const users: InterviewerUser[] = [{
      id: userId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'interviewer',
    }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ users }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAvailableInterviewerUsers()).resolves.toEqual(users);
    expect(fetchMock).toHaveBeenCalledWith('/api/users?pageSize=9999');
  });

  it('adds interviewers and aggregates per-user validation errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const users: InterviewerUser[] = [
      {
        id: userId,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'interviewer',
      },
      {
        id: 'not-a-uuid',
        name: 'Invalid User',
        email: 'invalid@example.com',
        role: 'interviewer',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));

    vi.stubGlobal('fetch', fetchMock);

    const result = await addPositionInterviewers({
      availableUsers: users,
      positionId,
      userIds: [userId, 'not-a-uuid'],
    });

    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.errors[0]).toContain('Invalid User: Invalid user ID format');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws API error messages when removing an interviewer fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
      { error: 'Cannot remove interviewer' },
      { status: 409, statusText: 'Conflict' }
    )));

    await expect(removePositionInterviewer(positionId, userId)).rejects.toThrow('Cannot remove interviewer');
  });
});
