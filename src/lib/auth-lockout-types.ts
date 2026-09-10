export interface LockoutQueryClient {
  query: (queryText: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

export interface FailedLoginAttemptsRow {
  failed_login_attempts?: number | null;
}

export interface AccountLockoutRow extends FailedLoginAttemptsRow {
  is_active?: boolean | null;
}

export interface AccountLockoutStatusRow extends FailedLoginAttemptsRow {
  locked_until?: Date | string | null;
  last_failed_login?: Date | string | null;
}

export type LoginFailureType = 'password' | '2fa' | 'passwordless';

export interface LockoutAlertOptions {
  now: Date;
  userId: string;
  email: string;
  failedAttempts: number;
}
