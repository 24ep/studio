import { describe, expect, it } from "vitest";

import {
  DEFAULT_SESSION_REDIRECT,
  DEFAULT_SESSION_VALIDATE_INTERVAL_MS,
  isSessionValidationTimeout,
  resolveSessionValidationOptions,
  sessionResponseHasUser,
  shouldAttemptSessionValidation,
  shouldInitializeSessionValidation,
  shouldResetSessionValidationInterval,
  shouldSkipSessionValidation,
} from "./session-validation-utils";

describe("session-validation-utils", () => {
  it("resolves default and explicit options", () => {
    expect(resolveSessionValidationOptions()).toEqual({
      validateInterval: DEFAULT_SESSION_VALIDATE_INTERVAL_MS,
      autoSignOut: true,
      redirectTo: DEFAULT_SESSION_REDIRECT,
    });

    expect(resolveSessionValidationOptions({
      validateInterval: 5,
      autoSignOut: false,
      redirectTo: "/custom",
    })).toEqual({
      validateInterval: 5,
      autoSignOut: false,
      redirectTo: "/custom",
    });
  });

  it("detects routes where validation should be skipped", () => {
    expect(shouldSkipSessionValidation(undefined)).toBe(false);
    expect(shouldSkipSessionValidation({ pathname: "/auth/signin", search: "" })).toBe(true);
    expect(shouldSkipSessionValidation({ pathname: "/dashboard", search: "?signout=true" })).toBe(true);
    expect(shouldSkipSessionValidation({ pathname: "/dashboard", search: "?signout=false" })).toBe(false);
  });

  it("classifies timeout errors", () => {
    expect(isSessionValidationTimeout(Object.assign(new Error("timeout"), { name: "TimeoutError" }))).toBe(true);
    expect(isSessionValidationTimeout(Object.assign(new Error("abort"), { name: "AbortError" }))).toBe(true);
    expect(isSessionValidationTimeout(new Error("network"))).toBe(false);
  });

  it("checks whether a response includes a user", () => {
    expect(sessionResponseHasUser({ user: { id: "user-1" } })).toBe(true);
    expect(sessionResponseHasUser({ user: null })).toBe(false);
    expect(sessionResponseHasUser({})).toBe(false);
  });

  it("decides whether validation should run now", () => {
    expect(shouldAttemptSessionValidation({
      location: { pathname: "/dashboard", search: "" },
      now: 200,
      lastValidationTime: 100,
      status: "authenticated",
      validateInterval: 50,
      validationInProgress: false,
    })).toBe(true);
    expect(shouldAttemptSessionValidation({
      location: { pathname: "/dashboard", search: "" },
      now: 120,
      lastValidationTime: 100,
      status: "authenticated",
      validateInterval: 50,
      validationInProgress: false,
    })).toBe(false);
    expect(shouldAttemptSessionValidation({
      location: { pathname: "/auth/signin", search: "" },
      now: 200,
      lastValidationTime: 100,
      status: "authenticated",
      validateInterval: 50,
      validationInProgress: false,
    })).toBe(false);
    expect(shouldAttemptSessionValidation({
      now: 200,
      lastValidationTime: 100,
      status: "loading",
      validateInterval: 50,
      validationInProgress: false,
    })).toBe(false);
  });

  it("decides interval reset and initialization behavior", () => {
    expect(shouldResetSessionValidationInterval({
      location: { pathname: "/dashboard", search: "?signout=true" },
      status: "authenticated",
    })).toBe(true);
    expect(shouldResetSessionValidationInterval({
      location: { pathname: "/dashboard", search: "" },
      status: "unauthenticated",
    })).toBe(true);
    expect(shouldResetSessionValidationInterval({
      location: { pathname: "/dashboard", search: "" },
      status: "authenticated",
    })).toBe(false);

    expect(shouldInitializeSessionValidation({
      hasInitialized: true,
      lastSessionId: "user-1",
      sessionId: "user-1",
    })).toBe(false);
    expect(shouldInitializeSessionValidation({
      hasInitialized: true,
      lastSessionId: "user-1",
      sessionId: "user-2",
    })).toBe(true);
  });
});
