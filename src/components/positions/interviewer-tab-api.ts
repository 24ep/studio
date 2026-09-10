import { getJsonArray, getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '../../lib/response-json';
import type { Interviewer, InterviewerUser } from './interviewer-tab-types';
import { isBlankEntityId, isValidUuid } from './interviewer-tab-utils';

export interface AddPositionInterviewersResult {
  errorCount: number;
  errors: string[];
  successCount: number;
}

interface AddPositionInterviewersParams {
  availableUsers: InterviewerUser[];
  positionId: string;
  userIds: string[];
}

export async function fetchPositionInterviewers(positionId: string): Promise<Interviewer[]> {
  const response = await fetch(`/api/positions/${positionId}/interviewers`);

  if (!response.ok) {
    throw new Error('Failed to load interviewers');
  }

  return normalizeInterviewers(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchAvailableInterviewerUsers(): Promise<InterviewerUser[]> {
  const response = await fetch('/api/users?pageSize=9999');

  if (!response.ok) {
    throw new Error('Failed to load users');
  }

  const data = await readJsonObject(response);
  return normalizeInterviewerUsers(getJsonArray(data, 'users') ?? []);
}

export async function addPositionInterviewers({
  availableUsers,
  positionId,
  userIds,
}: AddPositionInterviewersParams): Promise<AddPositionInterviewersResult> {
  const result: AddPositionInterviewersResult = {
    errorCount: 0,
    errors: [],
    successCount: 0,
  };

  await Promise.all(userIds.map(async (userId) => {
    try {
      if (isBlankEntityId(userId)) {
        throw new Error('Invalid user ID');
      }

      if (!isValidUuid(userId)) {
        throw new Error('Invalid user ID format (must be UUID)');
      }

      const response = await fetch(`/api/positions/${positionId}/interviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const responseData = await readJsonObject(response);

      if (!response.ok) {
        console.error('[InterviewerTab] Failed to add interviewer:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
        });
        throw new Error(getJsonErrorMessage(responseData, `Failed to add interviewer (${response.status})`));
      }

      result.successCount += 1;
    } catch (error) {
      result.errorCount += 1;
      result.errors.push(formatAddInterviewerError(availableUsers, userId, error));
    }
  }));

  return result;
}

function normalizeInterviewers(value: unknown): Interviewer[] {
  return Array.isArray(value) ? value.filter(isInterviewer) : [];
}

function normalizeInterviewerUsers(value: unknown[]): InterviewerUser[] {
  return value.filter(isInterviewerUser);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isInterviewer(value: unknown): value is Interviewer {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.userEmail === 'string' &&
    typeof value.userRole === 'string' &&
    typeof value.createdAt === 'string';
}

function isInterviewerUser(value: unknown): value is InterviewerUser {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string';
}

export async function removePositionInterviewer(positionId: string, userId: string) {
  const response = await fetch(`/api/positions/${positionId}/interviewers/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, 'Failed to remove interviewer'));
  }
}

function formatAddInterviewerError(
  availableUsers: InterviewerUser[],
  userId: string,
  error: unknown
) {
  const user = availableUsers.find((availableUser) => availableUser.id === userId);
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error('[InterviewerTab] Error adding interviewer:', {
    userId,
    user: user?.name,
    error: errorMessage,
  });

  return `${user?.name || userId}: ${errorMessage}`;
}
