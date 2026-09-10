import { AuthError, CredentialsSignin } from "next-auth";

export function getCredentialsSignInError(error: unknown) {
  const codeError = getTwoFactorCodeError(error);
  if (codeError) {
    return codeError;
  }

  if (error instanceof AuthError) {
    return getAuthErrorResult(error);
  }

  const stringError = getTwoFactorError(String(error));
  if (stringError) {
    return { error: stringError };
  }

  return { error: "An unexpected error occurred. Please try again." };
}

function getTwoFactorCodeError(error: unknown) {
  const code = getStringProperty(error, "code");
  if (code === "TWO_FACTOR_REQUIRED:totp" || code === "TWO_FACTOR_REQUIRED:email") {
    return { error: code };
  }

  const twoFactorError = getTwoFactorError(code);
  return twoFactorError ? { error: twoFactorError } : null;
}

function getAuthErrorResult(error: AuthError) {
  const messages = [error.message, ...getAuthErrorCauseMessages(error)];
  const twoFactorError = messages.map(getTwoFactorError).find(Boolean);
  if (twoFactorError) {
    return { error: twoFactorError };
  }

  if (error instanceof CredentialsSignin) {
    return { error: error.code || "CredentialsSignin" };
  }

  return { error: error.type || "CredentialsSignin" };
}

function getTwoFactorError(value: string | undefined | null) {
  if (typeof value !== "string" || !value.includes("TWO_FACTOR_REQUIRED")) {
    return null;
  }

  const match = value.match(/TWO_FACTOR_REQUIRED:(totp|email)/);
  return match ? match[0] : "TWO_FACTOR_REQUIRED:totp";
}

function getStringProperty(value: unknown, property: string) {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === "string" ? propertyValue : undefined;
}

function getAuthErrorCauseMessages(error: AuthError) {
  const cause = (error as { cause?: unknown }).cause;
  if (cause === null || typeof cause !== "object") {
    return [];
  }

  const causeRecord = cause as {
    message?: unknown;
    err?: {
      message?: unknown;
    };
  };

  return [causeRecord.message, causeRecord.err?.message].filter((message): message is string => (
    typeof message === "string"
  ));
}
