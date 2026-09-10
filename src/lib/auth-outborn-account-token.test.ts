import { afterEach, describe, expect, it, vi } from 'vitest';

import { refreshOutbornAccountAccessToken } from './auth-outborn-account-token';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('refreshOutbornAccountAccessToken', () => {
  it('rotates an Outborn Account refresh token for the public Hrive client', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('OUTBORN_ACCOUNT_AUTH_URL', 'https://account.example.com/');
    vi.stubEnv('OUTBORN_HRIVE_WEB_CLIENT_ID', 'outborn-hrive-web');
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-2',
      refresh_token: 'refresh-2',
      expires_in: 3600,
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshOutbornAccountAccessToken('refresh-1')).resolves.toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresAt: 1_800_003_600,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://account.example.com/api/auth/oauth2/token');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toContain('grant_type=refresh_token');
    expect(String(init.body)).toContain('refresh_token=refresh-1');
    expect(String(init.body)).toContain('client_id=outborn-hrive-web');
  });

  it('fails closed when Account returns an invalid refresh response', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('OUTBORN_ACCOUNT_AUTH_URL', 'https://account.example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-only',
      expires_in: 3600,
    }), { status: 200 })));

    await expect(refreshOutbornAccountAccessToken('refresh-1')).rejects.toThrow(/invalid refresh response/i);
  });
});
