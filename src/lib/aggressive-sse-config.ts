export const GLOBAL_EVENT_LIMIT = 20;
export const GLOBAL_WINDOW_MS = 1000;

export const BATCH_FLUSH_INTERVAL = 5000;
export const MAX_BATCH_SIZE = 30;

export const PRIORITY_DELAYS = {
  high: 0,
  medium: 200,
  low: 1000
} as const;

export const STALE_THRESHOLD = 10 * 60 * 1000;
export const CLEANUP_INTERVAL = 120000;
