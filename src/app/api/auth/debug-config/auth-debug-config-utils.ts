import {
  buildAuthDebugIssues,
  getAzureAdConfig,
  getNextAuthConfig,
} from './auth-debug-config-parts';

export type AuthDebugEnv = Partial<Record<
  | 'NEXTAUTH_SECRET'
  | 'NEXTAUTH_URL'
  | 'AZURE_AD_CLIENT_ID'
  | 'AZURE_AD_CLIENT_SECRET'
  | 'AZURE_AD_TENANT_ID'
  | 'NODE_ENV',
  string | undefined
>>;

export function buildAuthDebugResponse(env: AuthDebugEnv, timestamp = new Date().toISOString()) {
  const nextAuth = getNextAuthConfig(env);
  const azureAd = getAzureAdConfig(env, nextAuth.nextAuthUrl);
  const issues = buildAuthDebugIssues(nextAuth, azureAd);

  return {
    valid: nextAuth.hasSecret && nextAuth.hasUrl && !nextAuth.isPlaceholder && nextAuth.secretLength >= 32,
    config: {
      hasNextAuthSecret: nextAuth.hasSecret,
      hasNextAuthUrl: nextAuth.hasUrl,
      secretLength: nextAuth.secretLength,
      secretPreview: nextAuth.secretPreview,
      isPlaceholder: nextAuth.isPlaceholder,
      nextAuthUrl: nextAuth.nextAuthUrl,
      nodeEnv: env.NODE_ENV,
      timestamp,
      azureAd: {
        configured: azureAd.configured,
        hasClientId: azureAd.hasClientId,
        hasClientSecret: azureAd.hasClientSecret,
        hasTenantId: azureAd.hasTenantId,
        isPlaceholder: azureAd.isPlaceholder,
        clientId: azureAd.clientId,
        tenantId: azureAd.tenantId,
        expectedRedirectUri: azureAd.expectedRedirectUri,
      },
    },
    issues,
    azureAdSetupInstructions: azureAd.configured ? {
      step1: 'Go to Azure Portal -> App Registrations -> Your App',
      step2: 'Navigate to "Authentication" section',
      step3: `Add redirect URI: ${azureAd.expectedRedirectUri}`,
      step4: 'Ensure app is configured as "Web" platform (not "Public client")',
      step5: 'Verify client secret has not expired',
      step6: 'Check that required API permissions are granted',
    } : null,
  };
}
