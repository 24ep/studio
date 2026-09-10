type OutbornRefreshResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  error?: unknown;
  error_description?: unknown;
};

export interface RefreshedOutbornAccountToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const DEFAULT_REFRESH_TIMEOUT_MS = 7_000;

function normalizeBaseUrl(value: string | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, '') || '';
  if (!normalized) throw new Error('Outborn Account is not configured.');
  const parsed = new URL(normalized);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Outborn Account must use http or https.');
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('Outborn Account must use https in production.');
  }
  return normalized;
}

function clientId(): string {
  return process.env.OUTBORN_HRIVE_WEB_CLIENT_ID?.trim() || 'outborn-hrive-web';
}

function refreshTimeoutMs(): number {
  const configured = Number(process.env.OUTBORN_SERVICE_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 60_000
    ? Math.trunc(configured)
    : DEFAULT_REFRESH_TIMEOUT_MS;
}

function message(body: OutbornRefreshResponse): string {
  if (typeof body.error_description === 'string' && body.error_description) return body.error_description;
  if (typeof body.error === 'string' && body.error) return body.error;
  return 'Unable to refresh Outborn Account authorization.';
}

export async function refreshOutbornAccountAccessToken(
  refreshToken: string,
): Promise<RefreshedOutbornAccountToken> {
  const baseUrl = normalizeBaseUrl(process.env.OUTBORN_ACCOUNT_AUTH_URL || process.env.OUTBORN_ACCOUNT_BASE_URL);
  const response = await fetch(`${baseUrl}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId(),
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(refreshTimeoutMs()),
  });
  const body = await response.json().catch(() => ({})) as OutbornRefreshResponse;
  if (!response.ok) throw new Error(message(body));

  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const replacementRefreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
  const expiresIn = Number(body.expires_in);
  if (!accessToken || !replacementRefreshToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('Outborn Account returned an invalid refresh response.');
  }

  return {
    accessToken,
    refreshToken: replacementRefreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + Math.floor(expiresIn),
  };
}
