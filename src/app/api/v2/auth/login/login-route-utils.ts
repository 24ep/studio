import type { NextRequest } from 'next/server';

import { logAudit } from '@/lib/auditLog';
import { getJsonString } from '@/lib/response-json';
import { readRequestJsonObject } from '@/lib/request-json';
import type { ApiKeyData } from '@/lib/systemApiKeyManager';

export interface ApiKeyTokenIdentity {
  email: string;
  id: string;
  isSystemUser: true;
  modulePermissions: string[];
  name: string;
  role: string;
}

export async function extractApiKey(req: NextRequest): Promise<string | null> {
  const xApiKey = req.headers.get('x-api-key');
  if (xApiKey) {
    return xApiKey;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch && bearerMatch[1].startsWith('sk_')) {
      return bearerMatch[1];
    }
  }

  const body = await readRequestJsonObject(req);
  const apiKey = getJsonString(body, 'apiKey');
  if (apiKey) {
    return apiKey;
  }

  return null;
}

export function getClientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || undefined;
}

export function isAllowedApiKeyFormat(apiKey: string) {
  return apiKey.startsWith('sk_live_') || apiKey.startsWith('sk_test_');
}

export function calculateTokenExpiration(keyExpiresAt: Date | null): number {
  const oneHourFromNow = Math.floor(Date.now() / 1000) + (60 * 60);

  if (!keyExpiresAt) {
    return oneHourFromNow;
  }

  const keyExpiration = Math.floor(new Date(keyExpiresAt).getTime() / 1000);
  return Math.min(oneHourFromNow, keyExpiration);
}

export function buildApiKeyTokenIdentity(keyData: ApiKeyData): ApiKeyTokenIdentity {
  return {
    id: keyData.id,
    email: `api-key-${keyData.keyPrefix}@system`,
    name: `API: ${keyData.name}`,
    role: 'api_user',
    modulePermissions: ['*'],
    isSystemUser: true,
  };
}

export async function logV2AuthAudit(
  level: 'AUDIT' | 'ERROR' | 'WARN',
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await logAudit(level, message, 'API:V2:Auth:Login', null, data);
  } catch {
    // Preserve login behavior when audit logging is unavailable.
  }
}
