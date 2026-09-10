import { convertFieldsToTypes } from './api-payload-field-conversion';
import { mapNestedPayload } from './api-payload-recursive-utils';
import { convertStringBooleanOrNumber } from './api-payload-scalar-utils';

export { convertFieldsToTypes } from './api-payload-field-conversion';

export function convertStringBooleansAndNumbers(obj: unknown): unknown {
  const mapped = mapNestedPayload(obj, convertStringBooleansAndNumbers);
  if (mapped !== undefined) return mapped;

  if (typeof obj === 'string') {
    return convertStringBooleanOrNumber(obj, { requireTrimmedNumber: true });
  }

  return obj;
}

export function normalizePayloadTypes<T>(input: T): T {
  const mapped = mapNestedPayload(input, normalizePayloadTypes);
  if (mapped !== undefined) return mapped as unknown as T;

  if (typeof input === 'string') {
    return convertStringBooleanOrNumber(input, { requireTrimmedNumber: false }) as unknown as T;
  }

  return input;
}
