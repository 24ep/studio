import type { PlatformModuleId } from '@/lib/types';

export type AuthFailureCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DISABLED'
  | 'PASSWORD_SETUP_REQUIRED'
  | 'USER_NOT_FOUND'
  | 'SYSTEM_ERROR'
  | 'TWO_FACTOR_REQUIRED';

export type TwoFactorMethod = 'totp' | 'email';

export type AuthResult = {
  success: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    avatarUrl: string | null;
    personalColor: string | null;
    modulePermissions: PlatformModuleId[];
  };
} | {
  success: false;
  error: AuthFailureCode;
  message: string;
  lockedUntil?: Date;
  remainingAttempts?: number;
  twoFactorMethod?: TwoFactorMethod;
};

type AuthUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  avatarUrl?: string | null;
  personal_color?: string | null;
};

type SessionUserRow = AuthUserRow & {
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_method?: string | null;
};

type AuthFailureExtras = Partial<Omit<Extract<AuthResult, { success: false }>, 'success' | 'error' | 'message'>>;

export function authFailure(
  error: AuthFailureCode,
  message: string,
  extras: AuthFailureExtras = {},
): AuthResult {
  return {
    success: false,
    error,
    message,
    ...extras,
  };
}

export function userNotFoundFailure(): AuthResult {
  return authFailure('USER_NOT_FOUND', 'Invalid email or password');
}

export function accountLockedFailure(message = 'Account is locked due to too many failed login attempts. Please contact an administrator to unlock your account.'): AuthResult {
  return authFailure('ACCOUNT_LOCKED', message);
}

export function passwordSetupRequiredFailure(): AuthResult {
  return authFailure(
    'PASSWORD_SETUP_REQUIRED',
    'Set up your password using the secure link sent to your employee email before signing in.',
  );
}

export function invalidCredentialsFailure(message: string, extras: AuthFailureExtras = {}): AuthResult {
  return authFailure('INVALID_CREDENTIALS', message, extras);
}

export function systemAuthFailure(): AuthResult {
  return authFailure('SYSTEM_ERROR', 'An error occurred during authentication. Please try again.');
}

export function getAllowedAuthenticationMethods(methods: unknown): string[] {
  return Array.isArray(methods) ? methods : ['basic'];
}

export function isBasicPasswordLoginAllowed(password: string | undefined, allowedMethods: string[]): boolean {
  return !password || allowedMethods.includes('basic');
}

export function isPasswordlessLogin(password: string | undefined): boolean {
  return !password;
}

export function isTwoFactorRequired(
  password: string | undefined,
  globalTwoFactorEnabled: boolean,
  userTwoFactorEnabled: boolean,
): boolean {
  return isPasswordlessLogin(password) || globalTwoFactorEnabled || userTwoFactorEnabled;
}

export function getTwoFactorMethod(method: string | null | undefined): TwoFactorMethod {
  return method === 'totp' ? 'totp' : 'email';
}

export function hasBackupCode(backupCodes: unknown, code: string): boolean {
  return Array.isArray(backupCodes) && backupCodes.includes(code);
}

export function removeBackupCode(backupCodes: unknown, usedCode: string): string[] {
  return Array.isArray(backupCodes)
    ? backupCodes.filter((code): code is string => typeof code === 'string' && code !== usedCode)
    : [];
}

export function getFailedVerificationAttemptType(password: string | undefined): 'passwordless' | '2fa' {
  return isPasswordlessLogin(password) ? 'passwordless' : '2fa';
}

export function buildAuthSuccessResult(user: AuthUserRow, permissions: PlatformModuleId[]): AuthResult {
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      avatarUrl: user.avatarUrl ?? null,
      personalColor: user.personal_color ?? null,
      modulePermissions: permissions,
    },
  };
}

export function buildSessionUser(user: SessionUserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    avatarUrl: user.avatarUrl || user.image || null,
    personalColor: user.personal_color || null,
    isActive: user.is_active,
    twoFactorEnabled: user.two_factor_enabled,
    twoFactorMethod: user.two_factor_method,
  };
}

export function getErrorDiagnostics(error: unknown, userId: string) {
  return {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId,
    timestamp: new Date().toISOString(),
  };
}
