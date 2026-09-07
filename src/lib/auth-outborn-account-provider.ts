type OutbornAccountProviderInput = {
  accountBaseUrl: string;
  clientId: string;
};

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('OUTBORN_ACCOUNT_AUTH_URL is required');
  const parsed = new URL(trimmed);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('OUTBORN_ACCOUNT_AUTH_URL must use http or https');
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') throw new Error('OUTBORN_ACCOUNT_AUTH_URL must use https in production');
  return trimmed;
}

export function buildOutbornAccountProvider({ accountBaseUrl, clientId }: OutbornAccountProviderInput) {
  const baseUrl = normalizeBaseUrl(accountBaseUrl);
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) throw new Error('OUTBORN_HRIVE_WEB_CLIENT_ID is required');

  return {
    id: 'outborn-account',
    name: 'Outborn Account',
    type: 'oidc' as const,
    issuer: `${baseUrl}/api/auth`,
    clientId: normalizedClientId,
    clientSecret: '',
    authorization: {
      url: `${baseUrl}/api/auth/oauth2/authorize`,
      // Keep this aligned with Outborn Core's first-party identity manifest for
      // productKey `obsi-people` / clientId `outborn-hrive-web`.
      params: { scope: 'openid profile email' },
    },
    token: `${baseUrl}/api/auth/oauth2/token`,
    userinfo: `${baseUrl}/api/auth/oauth2/userinfo`,
    // Outborn Account keeps its ID token identity/security focused. Auth.js must
    // still validate that EdDSA token, then fetch the canonical profile claims
    // (including email/name) from the userinfo endpoint.
    idToken: false,
    checks: ['pkce', 'state'] as Array<'pkce' | 'state'>,
    client: {
      token_endpoint_auth_method: 'none' as const,
      id_token_signed_response_alg: 'EdDSA' as const,
    },
    profile(profile: Record<string, unknown>) {
      const sub = typeof profile.sub === 'string' ? profile.sub : '';
      const email = typeof profile.email === 'string' ? profile.email : '';
      const name = typeof profile.name === 'string' && profile.name.trim()
        ? profile.name.trim()
        : email.split('@')[0] || 'Obsi People user';
      const image = typeof profile.picture === 'string' ? profile.picture : null;
      return { id: sub, name, email, image, role: 'Recruiter' as const };
    },
  };
}

export function getConfiguredOutbornAccountProvider() {
  const accountBaseUrl = process.env.OUTBORN_ACCOUNT_AUTH_URL || process.env.OUTBORN_ACCOUNT_BASE_URL || '';
  const clientId = process.env.OUTBORN_HRIVE_WEB_CLIENT_ID || 'outborn-hrive-web';
  if (!accountBaseUrl.trim()) return null;
  return buildOutbornAccountProvider({ accountBaseUrl, clientId });
}
