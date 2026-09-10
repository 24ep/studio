/**
 * Hrive authentication configuration.
 *
 * Outborn Account is the canonical human identity provider. Azure AD and local
 * credentials are explicit legacy/emergency compatibility paths only and must
 * be opted in independently.
 */

import NextAuth from 'next-auth';
import AzureAD from 'next-auth/providers/azure-ad';

import { getResolvedAzureAdSettings } from '@/lib/auth-azure-ad-settings';
import { buildAuthCallbacks } from '@/lib/auth-callbacks';
import { buildCredentialsProvider } from '@/lib/auth-credentials-provider';
import { buildAuthEvents } from '@/lib/auth-events';
import { getConfiguredOutbornAccountProvider } from '@/lib/auth-outborn-account-provider';

const getAuthConfig = async () => {
  const outbornAccountProvider = getConfiguredOutbornAccountProvider();
  const legacyAzureEnabled = process.env.HRIVE_LEGACY_AZURE_AUTH_ENABLED === 'true';
  const legacyCredentialsEnabled = process.env.HRIVE_LEGACY_CREDENTIALS_AUTH_ENABLED === 'true';
  const azureAdSettings = legacyAzureEnabled ? await getResolvedAzureAdSettings() : null;

  const providers = [
    ...(outbornAccountProvider ? [outbornAccountProvider] : []),
    ...(legacyAzureEnabled && azureAdSettings?.isConfigured ? [
      AzureAD({
        clientId: azureAdSettings.clientId!,
        clientSecret: azureAdSettings.clientSecret!,
        issuer: `https://login.microsoftonline.com/${azureAdSettings.tenantId}/v2.0`,
        authorization: {
          params: {
            scope: 'openid profile email',
            response_mode: 'query',
          },
        },
        checks: ['pkce', 'state'],
      }),
    ] : []),
    ...(legacyCredentialsEnabled ? [buildCredentialsProvider()] : []),
  ];

  return {
    providers,
    trustHost: true,
    session: {
      strategy: 'jwt' as const,
      maxAge: 8 * 60 * 60,
    },
    cookies: {
      sessionToken: {
        name: 'next-auth.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax' as const,
          path: '/',
          secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'),
        },
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/auth/signin',
      error: '/auth/signin',
    },
    callbacks: buildAuthCallbacks(),
    events: buildAuthEvents(),
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth(getAuthConfig);
