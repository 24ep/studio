export function parseJsonArray<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return [...fallback];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

export function parseIntPreference(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function serializePreferenceValue(value: unknown): string {
  if (value === null) return 'null';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
