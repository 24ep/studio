import type { DbClient } from '@/lib/db';
import type { ApiKeyData } from './system-api-key-types';

export function getSystemApiKeyInvalidReason(apiKeyData: ApiKeyData): string | null {
  if (!apiKeyData.isActive) {
    return 'API key is disabled';
  }

  if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
    return 'API key has expired';
  }

  return null;
}

export async function recordSystemApiKeyUsage(
  client: DbClient,
  apiKeyId: string,
  ipAddress?: string
): Promise<void> {
  try {
    await client.query(
      `UPDATE "SystemApiKey"
       SET last_used_at = NOW(),
           last_used_ip = $1,
           usage_count = usage_count + 1,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [ipAddress || null, apiKeyId],
    );
  } catch (err: unknown) {
    console.error('[SystemApiKey] Failed to update usage stats:', err);
  }
}

export function getSystemApiKeyErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
