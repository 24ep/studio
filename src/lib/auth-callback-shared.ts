import type { Session } from 'next-auth';

import type { MutableAuthToken } from './auth-callback-types';

export function isSessionValidationError(error: unknown) {
  return error instanceof Error &&
    (error.message.includes('invalidated') || error.message.includes('expired'));
}

export function getTokenString(token: MutableAuthToken, key: keyof MutableAuthToken) {
  const value = token[key];
  return typeof value === 'string' ? value : undefined;
}

export function getSessionUpdateRecord(session: unknown) {
  return session && typeof session === 'object'
    ? session as Record<string, unknown>
    : undefined;
}

export function asMutableSession(session: Session) {
  return session as Session & { user?: Record<string, unknown> };
}
