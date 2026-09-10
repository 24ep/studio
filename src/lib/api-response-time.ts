export function getElapsedMilliseconds(startTimeMs: number, nowMs = Date.now()) {
  return Math.max(0, nowMs - startTimeMs);
}

export function formatResponseTime(startTimeMs: number, nowMs = Date.now()) {
  return `${getElapsedMilliseconds(startTimeMs, nowMs)}ms`;
}
