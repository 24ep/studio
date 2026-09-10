import type {
  AzureMeetingRoom,
  Interviewer,
  User,
} from './create-evaluate-link-utils';

export interface EvaluationLinkResponse {
  url: string;
  expiresAt: string;
}

export function parseCreateEvaluateLinkInterviewers(value: unknown): Interviewer[] {
  return Array.isArray(value) ? value.filter(isInterviewer) : [];
}

export function parseCreateEvaluateLinkUsers(value: unknown): User[] {
  return getArrayProperty(value, 'users').filter(isUser);
}

export function parseCreateEvaluateLinkAzureRooms(value: unknown): AzureMeetingRoom[] {
  return getArrayProperty(value, 'rooms').filter(isAzureMeetingRoom);
}

export function getArrayProperty(value: unknown, key: string): unknown[] {
  if (!isRecord(value)) return [];

  const property = value[key];
  return Array.isArray(property) ? property : [];
}

export function isEvaluationLinkResponse(value: unknown): value is EvaluationLinkResponse {
  return isRecord(value) &&
    typeof value.url === 'string' &&
    typeof value.expiresAt === 'string';
}

export function getEvaluationLinkErrorMessage(value: unknown) {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : 'Failed to create evaluation link';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInterviewer(value: unknown): value is Interviewer {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.userEmail === 'string';
}

function isUser(value: unknown): value is User {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string';
}

function isAzureMeetingRoom(value: unknown): value is AzureMeetingRoom {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.displayName === 'string';
}
