export function getDefaultCalendarCreateLinkExpireDate(now = new Date()) {
  const defaultExpireDate = new Date(now);
  defaultExpireDate.setDate(defaultExpireDate.getDate() + 7);
  return defaultExpireDate.toISOString().slice(0, 16);
}

export function getCalendarCreateLinkDurationDays(expireDate: string, now = new Date()) {
  const expiresAt = new Date(expireDate);
  if (Number.isNaN(expiresAt.getTime())) {
    return 7;
  }

  const diffMs = expiresAt.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}
