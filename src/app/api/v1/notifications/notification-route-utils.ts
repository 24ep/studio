import type { VerifiedApiToken } from '@/lib/auth';

export function getNotificationRouteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getNotificationActingUserName(user: VerifiedApiToken) {
  return user.name || user.email || user.id || 'System';
}

export function formatNotificationValidationErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
    .join('; ');
}

export function parseNotificationListParams(url: string) {
  const { searchParams } = new URL(url);

  return {
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    isRead: searchParams.get('isRead'),
  };
}

export function isBulkNotificationBody(body: unknown): body is { notifications: unknown[] } {
  return Boolean(
    body &&
    typeof body === 'object' &&
    'notifications' in body &&
    Array.isArray(body.notifications)
  );
}
