import {
  getNetworkErrorCode,
  getNetworkErrorStatus,
  getNetworkErrorText,
} from './network-error-extractors';

const RETRYABLE_ERROR_MESSAGES = [
  'fetch failed',
  'network',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'deadlock',
  'lock timeout',
  'connection pool',
];
const RETRYABLE_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']);
const NON_RETRYABLE_HTTP_STATUSES = new Set([401, 403, 404]);

export function calculateNetworkRetryDelay(attempt: number, baseDelay: number) {
  return baseDelay * Math.pow(2, attempt);
}

export function isNonRetryableHttpStatus(status: unknown) {
  return NON_RETRYABLE_HTTP_STATUSES.has(Number(status));
}

export function isNetworkRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = getNetworkErrorText(error);
  const errorCode = getNetworkErrorCode(error);

  if (RETRYABLE_ERROR_MESSAGES.some(fragment => errorMessage.includes(fragment))) {
    return true;
  }

  if (RETRYABLE_ERROR_CODES.has(errorCode)) {
    return true;
  }

  const status = getNetworkErrorStatus(error);
  return status !== undefined && status >= 500 && status < 600;
}
