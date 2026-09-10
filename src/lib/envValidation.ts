import {
  INSECURE_SECRET_PATTERNS,
  MIN_SECRET_LENGTH,
  NEXTAUTH_SECRET_MISSING_ERROR,
  NEXTAUTH_SECRET_PLACEHOLDER_ERROR,
  NEXTAUTH_SECRET_SHORT_WARNING,
  NEXTAUTH_URL_DEV_WARNING,
} from './envValidation-constants';
import {
  getCriticalNextAuthUrlIssue,
  getNextAuthSecretIssue,
  getProductionDatabaseIssues,
  getProductionNextAuthUrlIssue,
  isPlaceholderSecret,
} from './envValidation-issues';

type EnvRecord = NodeJS.ProcessEnv;

export function validateNextAuthSecret(): void {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(NEXTAUTH_SECRET_MISSING_ERROR);
  }

  if (isPlaceholderSecret(secret)) {
    throw new Error(NEXTAUTH_SECRET_PLACEHOLDER_ERROR);
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.warn(NEXTAUTH_SECRET_SHORT_WARNING);
  }
}

export function validateNextAuthUrl(): void {
  const url = process.env.NEXTAUTH_URL;

  if (process.env.NODE_ENV !== 'production') {
    if (!url) {
      console.warn(NEXTAUTH_URL_DEV_WARNING);
    }
    return;
  }

  const issue = getProductionNextAuthUrlIssue(url);
  if (issue) {
    throw new Error(issue);
  }
}

export function validateCriticalEnvVars(): void {
  const errors = collectCriticalEnvErrors(process.env);

  if (errors.length === 0) {
    return;
  }

  const errorMessage = `Environment Variable Validation Failed:\n${errors.join('\n')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMessage);
  }

  console.error(`SECURITY WARNINGS:\n${errorMessage}`);
}

export function isSecureSecret(secret: string): boolean {
  return secret.length >= MIN_SECRET_LENGTH && !INSECURE_SECRET_PATTERNS.some(pattern => pattern.test(secret));
}

export function collectCriticalEnvErrors(env: EnvRecord): string[] {
  const errors = [
    getNextAuthSecretIssue(env.NEXTAUTH_SECRET),
    getCriticalNextAuthUrlIssue(env),
    ...getProductionDatabaseIssues(env),
  ];

  return errors.filter((error): error is string => Boolean(error));
}
