import { getJsonErrorMessage, getJsonString, readJsonObject } from '@/lib/response-json';

import type { TwoFactorSetupMethod } from './two-factor-setup-utils';

export interface TwoFactorSetupResponse {
  qrCodeUrl: string | null;
  secret: string | null;
}

export interface TwoFactorVerifyResponse {
  backupCodes: unknown;
}

export async function requestTwoFactorSetup(method: TwoFactorSetupMethod): Promise<TwoFactorSetupResponse> {
  const response = await postTwoFactorJson('/api/auth/2fa/setup', { method });

  return {
    qrCodeUrl: getJsonString(response, 'qrCodeUrl') || null,
    secret: getJsonString(response, 'secret') || null,
  };
}

export async function requestTwoFactorVerification(code: string): Promise<TwoFactorVerifyResponse> {
  const response = await postTwoFactorJson('/api/auth/2fa/verify', { code });
  return {
    backupCodes: response.backupCodes,
  };
}

async function postTwoFactorJson(
  url: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(data, 'Request failed'));
  }

  return data;
}
