import {
  NEXTAUTH_SECRET_MISSING_ERROR,
  NEXTAUTH_SECRET_PLACEHOLDER_ERROR,
  NEXTAUTH_SECRET_PLACEHOLDER_VALUES,
} from './envValidation-constants';

type EnvRecord = NodeJS.ProcessEnv;

export function getNextAuthSecretIssue(secret: string | undefined) {
  if (!secret) return NEXTAUTH_SECRET_MISSING_ERROR;
  if (isPlaceholderSecret(secret)) return NEXTAUTH_SECRET_PLACEHOLDER_ERROR;
  return null;
}

export function getCriticalNextAuthUrlIssue(env: EnvRecord) {
  if (env.NODE_ENV !== 'production') return null;
  return getProductionNextAuthUrlIssue(env.NEXTAUTH_URL);
}

export function getProductionNextAuthUrlIssue(url: string | undefined) {
  if (!url) {
    return 'CRITICAL CONFIGURATION ERROR: NEXTAUTH_URL environment variable is not set in production. ' +
      'This is required for NextAuth.js to function properly. Set it to your application\'s base URL (e.g., https://yourdomain.com)';
  }

  const parsedUrl = parseNextAuthUrl(url);
  if (!parsedUrl) {
    return 'CRITICAL CONFIGURATION ERROR: NEXTAUTH_URL is not a valid URL. ' +
      `Current value: ${url}. Expected format: https://yourdomain.com or http://localhost:8021`;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return 'CRITICAL CONFIGURATION ERROR: NEXTAUTH_URL must use http:// or https:// protocol. ' +
      `Current value: ${url}`;
  }

  warnForProductionHttpUrl(parsedUrl.protocol);

  if (containsPlaceholderUrlValue(url)) {
    return 'CRITICAL CONFIGURATION ERROR: NEXTAUTH_URL contains placeholder values. ' +
      `Current value: ${url}. Set it to your actual application URL.`;
  }

  return null;
}

export function getProductionDatabaseIssues(env: EnvRecord) {
  if (env.NODE_ENV !== 'production') return [];

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    return ['CRITICAL: DATABASE_URL is not set in production environment'];
  }

  if (databaseUrl.includes('CHANGE_THIS') || databaseUrl.includes('localhost')) {
    return [
      'SECURITY WARNING: DATABASE_URL appears to contain placeholder values. ' +
      'Ensure production database credentials are properly configured.',
    ];
  }

  return [];
}

export function isPlaceholderSecret(secret: string) {
  return (NEXTAUTH_SECRET_PLACEHOLDER_VALUES as readonly string[]).includes(secret);
}

function parseNextAuthUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function warnForProductionHttpUrl(protocol: string) {
  if (protocol === 'http:') {
    console.warn(
      'SECURITY WARNING: NEXTAUTH_URL is using http:// in production. ' +
      'Consider using https:// for secure connections.'
    );
  }
}

function containsPlaceholderUrlValue(url: string) {
  return url.includes('CHANGE_THIS') ||
    url.includes('your-domain') ||
    url.includes('yourdomain');
}
