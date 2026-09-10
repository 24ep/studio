import { describe, expect, it } from "vitest";

import { vi } from "vitest";

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type = "AuthError";
  },
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "CredentialsSignin";
  },
}));

import { getCredentialsSignInError } from "./auth-error-utils";

describe("auth-error-utils", () => {
  it("extracts two-factor errors from loose code objects and strings", () => {
    expect(getCredentialsSignInError({ code: "TWO_FACTOR_REQUIRED:email" }))
      .toEqual({ error: "TWO_FACTOR_REQUIRED:email" });

    expect(getCredentialsSignInError({ code: "prefix TWO_FACTOR_REQUIRED:totp suffix" }))
      .toEqual({ error: "TWO_FACTOR_REQUIRED:totp" });

    expect(getCredentialsSignInError("TWO_FACTOR_REQUIRED"))
      .toEqual({ error: "TWO_FACTOR_REQUIRED:totp" });
  });

  it("returns a generic message for unknown errors", () => {
    expect(getCredentialsSignInError(new Error("network failed"))).toEqual({
      error: "An unexpected error occurred. Please try again.",
    });
  });
});
