import { describe, expect, it } from 'vitest';

import { handleJwtCallback } from './auth-jwt-callback';

describe('Hrive Outborn Account JWT bridge', () => {
  it('retains Account OAuth credentials only in the encrypted Auth.js JWT payload', async () => {
    const token = await handleJwtCallback({
      token: {
        id: '00000000-0000-4000-8000-000000000000',
        role: 'Recruiter',
      },
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Hrive Admin',
        email: 'admin@example.com',
        role: 'Admin',
      },
      account: {
        provider: 'outborn-account',
        type: 'oidc',
        providerAccountId: 'account-user-1',
        access_token: 'account-access-token',
        refresh_token: 'account-refresh-token',
        expires_at: 2_000_000_000,
      },
    });

    expect(token.outbornAccountAccessToken).toBe('account-access-token');
    expect(token.outbornAccountAccessTokenExpiresAt).toBe(2_000_000_000);
    expect(token.outbornAccountRefreshToken).toBe('account-refresh-token');
    expect(token.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('does not treat legacy provider access tokens as Outborn Account credentials', async () => {
    const token = await handleJwtCallback({
      token: {
        id: '11111111-1111-4111-8111-111111111111',
        role: 'Recruiter',
      },
      account: {
        provider: 'azure-ad',
        type: 'oidc',
        providerAccountId: 'legacy-user',
        access_token: 'legacy-access-token',
      },
    });

    expect(token.outbornAccountAccessToken).toBeUndefined();
    expect(token.outbornAccountRefreshToken).toBeUndefined();
  });
});
