export function toFiniteTimelineNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getTimelineMonthIndex(value: unknown): number {
  const monthNumber = toFiniteTimelineNumber(value);
  return monthNumber !== null && monthNumber >= 1 && monthNumber <= 12
    ? monthNumber - 1
    : 0;
}

export function getTimelineYear(value: unknown): number | null {
  const year = toFiniteTimelineNumber(value);
  return year !== null && year > 0 ? year : null;
}
