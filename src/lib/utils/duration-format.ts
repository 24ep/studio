import { safeToDate } from './date-format';

/**
 * Calculates duration between two dates and returns a human-readable string
 */
export function calculateDuration(processDate?: string | null, completedDate?: string | null): string {
  const start = safeToDate(processDate);
  const end = completedDate ? safeToDate(completedDate) : new Date();
  if (!start || !end) return '-';

  return formatDurationSeconds(Math.floor((end.getTime() - start.getTime()) / 1000));
}

function formatDurationSeconds(diffSeconds: number) {
  if (!Number.isFinite(diffSeconds) || diffSeconds < 0) return '-';

  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  }

  return `${diffSeconds}s`;
}
