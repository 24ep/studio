import { describe, expect, it } from 'vitest';

import { buildOutbornAccountProvider } from './auth-outborn-account-provider';

describe('Outborn Account Auth.js provider', () => {
  it('validates EdDSA ID tokens, uses userinfo, and requests only Obsi People approved scopes', () => {
    const provider = buildOutbornAccountProvider({
      accountBaseUrl: 'https://account.example.com/',
      clientId: 'outborn-hrive-web',
    });
    const clientMetadata = provider.client as Record<string, unknown> | undefined;

    expect(provider.id).toBe('outborn-account');
    expect(provider.issuer).toBe('https://account.example.com/api/auth');
    expect(provider.authorization?.url).toBe('https://account.example.com/api/auth/oauth2/authorize');
    expect(provider.token).toBe('https://account.example.com/api/auth/oauth2/token');
    expect(provider.userinfo).toBe('https://account.example.com/api/auth/oauth2/userinfo');
    expect(provider.idToken).toBe(false);
    expect(provider.checks).toEqual(['pkce', 'state']);
    expect(clientMetadata?.token_endpoint_auth_method).toBe('none');
    expect(clientMetadata?.id_token_signed_response_alg).toBe('EdDSA');

    const scope = provider.authorization?.params?.scope;
    expect(scope).toBe('openid profile email');
    expect(scope).not.toContain('offline_access');
    expect(scope).not.toContain('organizations');
  });
});
