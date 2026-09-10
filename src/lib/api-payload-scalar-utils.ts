export function convertStringBooleanOrNumber(
  value: string,
  { requireTrimmedNumber }: { requireTrimmedNumber: boolean }
) {
  const lower = value.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  if (isNumericString(value, requireTrimmedNumber)) {
    const num = Number(value);
    return Number.isInteger(num) ? Math.trunc(num) : num;
  }

  return value;
}

export function normalizeNumberField(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

export function normalizeBooleanField(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

function isNumericString(value: string, requireTrimmedNumber: boolean) {
  return (requireTrimmedNumber ? value.trim() !== '' : value !== '') &&
    !Number.isNaN(Number(value));
}
