import crypto from 'crypto';

const KEY_PREFIX_PROD = 'sk_live_';
const KEY_PREFIX_DEV = 'sk_test_';

function getKeyPrefix(): string {
  return process.env.NODE_ENV === 'production' ? KEY_PREFIX_PROD : KEY_PREFIX_DEV;
}

export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(24);
  return `${getKeyPrefix()}${randomBytes.toString('base64url')}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function getKeyDisplayPrefix(key: string): string {
  return key.substring(0, 12);
}

export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}...`;
}

export function isSystemApiKeyFormat(key: string): boolean {
  return Boolean(key && (key.startsWith(KEY_PREFIX_PROD) || key.startsWith(KEY_PREFIX_DEV)));
}

