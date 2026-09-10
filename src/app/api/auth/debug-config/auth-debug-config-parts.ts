import type { AuthDebugEnv } from './auth-debug-config-utils';

const NEXTAUTH_SECRET_PLACEHOLDER_VALUES = [
  'CHANGE_THIS_GENERATE_SECURE_SECRET_USING_OPENSSL',
  'your-local-development-secret-key-change-this',
  'your-secret-key',
  'secret',
  'dev-secret',
  'test-secret',
] as const;

const AZURE_AD_PLACEHOLDER_VALUES = [
  'your_azure_ad_application_client_id',
  'your_azure_ad_client_secret',
  'your_azure_ad_directory_tenant_id',
  'your-azure-ad-client-id',
  'your-azure-ad-client-secret',
  'your-azure-ad-tenant-id',
] as const;

export function getNextAuthConfig(env: AuthDebugEnv) {
  const secret = env.NEXTAUTH_SECRET;
  const nextAuthUrl = env.NEXTAUTH_URL || 'NOT SET';
  const secretLength = secret?.length || 0;

  return {
    hasSecret: Boolean(secret),
    hasUrl: Boolean(env.NEXTAUTH_URL),
    secretLength,
    secretPreview: secret ? `[set: ${secretLength} characters]` : 'NOT SET',
    isPlaceholder: isPlaceholderValue(secret, NEXTAUTH_SECRET_PLACEHOLDER_VALUES),
    nextAuthUrl,
  };
}

export function getAzureAdConfig(env: AuthDebugEnv, nextAuthUrl: string) {
  const flags = getAzureAdConfigFlags(env);

  return {
    ...flags,
    configured: flags.hasClientId && flags.hasClientSecret && flags.hasTenantId && !flags.isPlaceholder,
    setupAttempted: flags.hasClientId || flags.hasClientSecret || flags.hasTenantId || flags.isPlaceholder,
    clientId: previewClientId(env.AZURE_AD_CLIENT_ID),
    tenantId: env.AZURE_AD_TENANT_ID || 'NOT SET',
    expectedRedirectUri: nextAuthUrl !== 'NOT SET'
      ? `${nextAuthUrl}/api/auth/callback/azure-ad`
      : 'NOT SET (NEXTAUTH_URL required)',
  };
}

export function buildAuthDebugIssues(
  nextAuth: ReturnType<typeof getNextAuthConfig>,
  azureAd: ReturnType<typeof getAzureAdConfig>
) {
  return [
    !nextAuth.hasSecret && 'NEXTAUTH_SECRET is not set',
    !nextAuth.hasUrl && 'NEXTAUTH_URL is not set',
    nextAuth.isPlaceholder && 'NEXTAUTH_SECRET is set to a placeholder value',
    nextAuth.secretLength < 32 && 'NEXTAUTH_SECRET is too short (should be at least 32 characters)',
    azureAd.setupAttempted && !azureAd.hasClientId && 'AZURE_AD_CLIENT_ID is not set',
    azureAd.setupAttempted && !azureAd.hasClientSecret && 'AZURE_AD_CLIENT_SECRET is not set',
    azureAd.setupAttempted && !azureAd.hasTenantId && 'AZURE_AD_TENANT_ID is not set',
    azureAd.isPlaceholder && 'Azure AD credentials are set to placeholder values',
    azureAd.configured && nextAuth.nextAuthUrl === 'NOT SET' && 'NEXTAUTH_URL must be set for Azure AD redirect URI',
  ].filter((issue): issue is string => Boolean(issue));
}

function getAzureAdConfigFlags(env: AuthDebugEnv) {
  const hasClientId = Boolean(env.AZURE_AD_CLIENT_ID);
  const hasClientSecret = Boolean(env.AZURE_AD_CLIENT_SECRET);
  const hasTenantId = Boolean(env.AZURE_AD_TENANT_ID);
  const isPlaceholder = [
    env.AZURE_AD_CLIENT_ID,
    env.AZURE_AD_CLIENT_SECRET,
    env.AZURE_AD_TENANT_ID,
  ].some((value) => isPlaceholderValue(value, AZURE_AD_PLACEHOLDER_VALUES));

  return { hasClientId, hasClientSecret, hasTenantId, isPlaceholder };
}

function isPlaceholderValue(value: string | undefined, placeholders: readonly string[]) {
  return Boolean(value && placeholders.includes(value));
}

function previewClientId(clientId: string | undefined) {
  if (!clientId) return 'NOT SET';
  return clientId.length > 20 ? `${clientId.substring(0, 20)}...` : clientId;
}
