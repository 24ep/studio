import { getSystemSetting } from '@/lib/systemSettings';
import { isAzureAdSettingsConfigured, type AzureAdSettings } from '@/lib/auth-config-utils';

export type ResolvedAzureAdSettings = AzureAdSettings & {
  isConfigured: boolean;
};

export async function getResolvedAzureAdSettings(): Promise<ResolvedAzureAdSettings> {
  const clientId = (await getSystemSetting('azureAdClientId')) || process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = (await getSystemSetting('azureAdClientSecret')) || process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = (await getSystemSetting('azureAdTenantId')) || process.env.AZURE_AD_TENANT_ID;

  return {
    clientId,
    clientSecret,
    tenantId,
    isConfigured: isAzureAdSettingsConfigured({
      clientId,
      clientSecret,
      tenantId,
    }),
  };
}
