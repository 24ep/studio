export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function getRecordProperty(value: unknown, propertyName: string): Record<string, unknown> | undefined {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return isRecord(property) ? property : undefined;
}

export function getArrayProperty(value: unknown, propertyName: string): unknown[] {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return Array.isArray(property) ? property : [];
}

export function getStringProperty(value: unknown, propertyName: string): string | undefined {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return typeof property === 'string' ? property : undefined;
}

export function getStringArrayProperty(value: unknown, propertyName: string): string[] {
  return getArrayProperty(value, propertyName).filter((item): item is string => typeof item === 'string');
}

export function getAiApiErrorMessage(data: unknown) {
  const error = getRecordProperty(data, 'error');
  return getStringProperty(error, 'message') || JSON.stringify(error || {});
}
