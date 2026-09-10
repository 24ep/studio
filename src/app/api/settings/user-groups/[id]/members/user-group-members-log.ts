export function sanitizeLogValue(value: unknown) {
  return String(value || '').replace(/[\n\r\t]/g, '');
}
