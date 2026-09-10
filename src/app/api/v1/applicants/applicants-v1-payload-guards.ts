import type { JsonRecord } from './applicants-v1-payload-types';

export function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
