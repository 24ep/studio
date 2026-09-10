export function parseLifecycleDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' || !value.trim()) return null;

  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00`)
    : new Date(trimmed);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
}

export function offboardingDateLabel(value: unknown, locale?: string) {
  const date = parseLifecycleDate(value);
  if (!date) return 'Date required';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function offboardingDaysRemaining(value: unknown, now = new Date()) {
  const date = parseLifecycleDate(value);
  if (!date) return null;
  const deadline = new Date(date);
  deadline.setHours(23, 59, 59, 999);
  return Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
}
