import type { JsonObject } from "@/lib/response-json";

export const DEFAULT_SESSION_VALIDATE_INTERVAL_MS = 30 * 60 * 1000;
export const DEFAULT_SESSION_REQUEST_TIMEOUT_MS = 15_000;
export const DEFAULT_SESSION_REDIRECT = "/auth/signin";

export interface SessionValidationOptions {
  validateInterval?: number;
  autoSignOut?: boolean;
  redirectTo?: string;
}

export interface ResolvedSessionValidationOptions {
  validateInterval: number;
  autoSignOut: boolean;
  redirectTo: string;
}

interface SessionValidationLocation {
  pathname: string;
  search: string;
}

type SessionValidationStatus = "loading" | "authenticated" | "unauthenticated";

interface ShouldAttemptSessionValidationInput {
  location?: SessionValidationLocation;
  now: number;
  lastValidationTime: number;
  status: SessionValidationStatus;
  validateInterval: number;
  validationInProgress: boolean;
}

interface ShouldInitializeSessionValidationInput {
  hasInitialized: boolean;
  lastSessionId?: string;
  sessionId?: string;
}

export function resolveSessionValidationOptions(
  options: SessionValidationOptions = {},
): ResolvedSessionValidationOptions {
  return {
    validateInterval: options.validateInterval ?? DEFAULT_SESSION_VALIDATE_INTERVAL_MS,
    autoSignOut: options.autoSignOut !== false,
    redirectTo: options.redirectTo ?? DEFAULT_SESSION_REDIRECT,
  };
}

export function shouldSkipSessionValidation(
  location: SessionValidationLocation | undefined,
): boolean {
  if (!location) {
    return false;
  }

  const searchParams = new URLSearchParams(location.search);

  return location.pathname === DEFAULT_SESSION_REDIRECT || searchParams.get("signout") === "true";
}

export function isSessionValidationTimeout(error: Error): boolean {
  return error.name === "AbortError" || error.name === "TimeoutError";
}

export function sessionResponseHasUser(sessionData: JsonObject): boolean {
  return Boolean(sessionData.user);
}

export function shouldAttemptSessionValidation({
  location,
  now,
  lastValidationTime,
  status,
  validateInterval,
  validationInProgress,
}: ShouldAttemptSessionValidationInput): boolean {
  if (validationInProgress || shouldSkipSessionValidation(location)) {
    return false;
  }

  if (status !== "authenticated") {
    return false;
  }

  return now - lastValidationTime >= validateInterval;
}

export function shouldResetSessionValidationInterval({
  location,
  status,
}: {
  location?: SessionValidationLocation;
  status: SessionValidationStatus;
}): boolean {
  return shouldSkipSessionValidation(location) || status !== "authenticated";
}

export function shouldInitializeSessionValidation({
  hasInitialized,
  lastSessionId,
  sessionId,
}: ShouldInitializeSessionValidationInput): boolean {
  return !(hasInitialized && lastSessionId === sessionId);
}
