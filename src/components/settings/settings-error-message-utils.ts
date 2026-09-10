function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getStringProperty(source: Record<string, unknown>, property: string) {
  const value = source[property];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function getSettingsErrorMessage(error: unknown, fallback: string) {
  if (!isRecord(error)) {
    return fallback;
  }

  const details = Array.isArray(error.details) ? error.details : [];
  const firstDetail = details.find(isRecord);

  return getStringProperty(error, 'message')
    ?? getStringProperty(error, 'error')
    ?? (firstDetail ? getStringProperty(firstDetail, 'message') : undefined)
    ?? fallback;
}
