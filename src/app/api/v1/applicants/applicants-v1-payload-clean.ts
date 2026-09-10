import { isRecord } from './applicants-v1-payload-guards';
import type { JsonRecord } from './applicants-v1-payload-types';

function normalizeIsCurrentValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return typeof value === 'number' ? value === 1 : Boolean(value);
}

function cleanPayloadEntry(key: string, value: unknown) {
  if (key === 'isCurrent') {
    return normalizeIsCurrentValue(value);
  }

  if (key === 'email' && typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  return typeof value === 'string' ? value.trim() : cleanPayload(value);
}

export function cleanPayload(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload);
  }

  if (isRecord(obj)) {
    const result: JsonRecord = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value !== '') {
        result[key] = cleanPayloadEntry(key, value);
      }
    }

    return result;
  }

  return obj;
}
