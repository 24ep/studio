const MIN_MESSAGE_LENGTH = 10;

export function normalizeHrWidgetMessage(message: string) {
  return message.replace(/\s+/g, ' ').trim();
}

export function hasEnoughHrWidgetMessageDetail(message: string) {
  return normalizeHrWidgetMessage(message).length >= MIN_MESSAGE_LENGTH;
}

export function buildHrWidgetSubject(message: string) {
  const normalized = normalizeHrWidgetMessage(message);
  return normalized.length > 76 ? `${normalized.slice(0, 73).trimEnd()}...` : normalized;
}

export { MIN_MESSAGE_LENGTH };
