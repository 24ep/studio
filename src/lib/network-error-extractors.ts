import type { ErrorLikeRecord } from './network-error-types';

function isErrorLikeRecord(error: unknown): error is ErrorLikeRecord {
  return error !== null && typeof error === 'object';
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

function getNumericStatus(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function getNetworkErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (!isErrorLikeRecord(error)) return stringifyUnknown(error);

  if (typeof error.message === 'string') {
    return error.message;
  }

  const toStringMethod = error.toString;
  return typeof toStringMethod === 'function' ? String(toStringMethod.call(error)) : '';
}

export function getNetworkErrorCode(error: unknown): string {
  if (!isErrorLikeRecord(error)) return '';
  return stringifyUnknown(error.code);
}

export function getNetworkErrorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (!isErrorLikeRecord(error)) return '';
  return stringifyUnknown(error.name);
}

export function getNetworkErrorStatus(error: unknown): number | undefined {
  if (!isErrorLikeRecord(error)) return undefined;
  return getNumericStatus(error.status) ?? getNumericStatus(error.statusCode);
}
