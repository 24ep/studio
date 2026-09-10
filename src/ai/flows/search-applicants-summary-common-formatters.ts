export function formatFitScore(fitScore: number) {
  return fitScore < 1 ? Math.round(fitScore * 100) : fitScore;
}

export function formatOptionalLine(label: string, value: unknown) {
  if (value) {
    return `${label}: ${value}`;
  }

  return null;
}

export function appendIfPresent(summaryParts: string[], label: string, value: unknown) {
  const line = formatOptionalLine(label, value);
  if (line) {
    summaryParts.push(line);
  }
}

export function formatOptionalSegment(label: string, value: unknown) {
  return value ? `, ${label}: ${value}` : '';
}

export function truncateDescription(description: string) {
  return description.substring(0, 250) + (description.length > 250 ? '...' : '');
}
