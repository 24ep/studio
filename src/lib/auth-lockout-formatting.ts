export function maskEmail(email: string): string {
  if (!email || email.indexOf('@') === -1) return '[invalid]';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  return `${maskedLocal}@${domain}`;
}

export function parseLockoutAlertEmails(alertEmailsSetting?: string | null): string[] {
  if (!alertEmailsSetting) return [];

  try {
    const parsed = JSON.parse(alertEmailsSetting);
    if (Array.isArray(parsed)) {
      return parsed.filter((email): email is string => typeof email === 'string' && email.trim().length > 0);
    }
  } catch {
    return alertEmailsSetting
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  }

  return [];
}
