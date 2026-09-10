export function coerceHrFieldValue<T extends { type: string }>(field: T, value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  if (field.type === 'number') return Number(value);
  if (field.type === 'json' || field.type === 'jsonValue') return JSON.stringify(value);
  if (field.type === 'select' && (value === 'true' || value === 'false')) return value === 'true';
  if (field.type === 'date') return new Date(String(value));
  return value;
}
