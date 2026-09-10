export const MIN_SECRET_LENGTH = 32;

export const NEXTAUTH_SECRET_PLACEHOLDER_VALUES = [
  'CHANGE_THIS_GENERATE_SECURE_SECRET_USING_OPENSSL',
  'your-local-development-secret-key-change-this',
  'your-secret-key',
  'secret',
  'dev-secret',
  'test-secret',
] as const;

export const INSECURE_SECRET_PATTERNS = [
  /^CHANGE_THIS/i,
  /^your-/i,
  /^dev-/i,
  /^test-/i,
  /^secret$/i,
  /^password$/i,
] as const;

export const NEXTAUTH_SECRET_MISSING_ERROR =
  'CRITICAL SECURITY ERROR: NEXTAUTH_SECRET environment variable is not set. ' +
  'This is required for JWT token signing. Generate a secure secret using: openssl rand -base64 32';
export const NEXTAUTH_SECRET_PLACEHOLDER_ERROR =
  'CRITICAL SECURITY ERROR: NEXTAUTH_SECRET is set to a placeholder/default value. ' +
  'This is insecure and must be changed. Generate a secure secret using: openssl rand -base64 32';
export const NEXTAUTH_SECRET_SHORT_WARNING =
  'SECURITY WARNING: NEXTAUTH_SECRET is shorter than recommended (32+ characters). ' +
  'Consider generating a longer secret for better security.';
export const NEXTAUTH_URL_DEV_WARNING =
  'WARNING: NEXTAUTH_URL is not set. NextAuth.js may not work correctly. ' +
  'Set it to your local development URL (e.g., http://localhost:8021)';
