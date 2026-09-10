export type SystemApiKeyExpirationOption = 'never' | '30days' | '90days' | '1year' | 'custom';

export interface SystemApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  maskedKey: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  usageCount: number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export function calculateSystemApiKeyExpirationDate({
  expiration,
  customExpiration,
  now = new Date(),
}: {
  expiration: SystemApiKeyExpirationOption;
  customExpiration?: string;
  now?: Date;
}): Date | null {
  switch (expiration) {
    case 'never':
      return null;
    case '30days':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '90days':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '1year':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'custom':
      return customExpiration ? new Date(customExpiration) : null;
    default:
      return null;
  }
}

export function buildSystemApiKeyCreatePayload({
  name,
  description,
  expiration,
  customExpiration,
}: {
  name: string;
  description: string;
  expiration: SystemApiKeyExpirationOption;
  customExpiration?: string;
}) {
  const expiresAt = calculateSystemApiKeyExpirationDate({
    expiration,
    customExpiration,
  });

  return {
    name: name.trim(),
    description: description.trim() || null,
    expiresAt: expiresAt?.toISOString() || null,
  };
}

export function formatSystemApiKeyDate(dateStr: string | null) {
  if (!dateStr) return 'Never';

  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isSystemApiKeyExpired(apiKey: Pick<SystemApiKey, 'expiresAt'>, now = new Date()) {
  return Boolean(apiKey.expiresAt && new Date(apiKey.expiresAt) < now);
}
