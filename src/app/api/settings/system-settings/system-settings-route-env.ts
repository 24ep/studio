interface EnvMapping {
  key: string;
  envVar: string;
  defaultValue?: string;
}

export type SystemSettingRow = {
  key: string;
  value: string;
};

export type SystemSettingsMap = Record<string, string | boolean | null | undefined>;

export const GET_ENV_MAPPINGS: EnvMapping[] = [
  { key: 'geminiApiKey', envVar: 'GOOGLE_API_KEY' },
  { key: 'openaiApiKey', envVar: 'OPENAI_API_KEY' },
  { key: 'deepseekApiKey', envVar: 'DEEPSEEK_API_KEY' },
  { key: 'resumeProcessingWebhookUrl', envVar: 'RESUME_PROCESSING_WEBHOOK_URL' },
  { key: 'resumeProcessingWebhookToken', envVar: 'RESUME_PROCESSING_WEBHOOK_TOKEN' },
  { key: 'resumeProcessingWebhookResponseMode', envVar: 'RESUME_PROCESSING_WEBHOOK_RESPONSE_MODE', defaultValue: 'blocking' },
  { key: 'resumeProcessingWebhookTimeout', envVar: 'RESUME_PROCESSING_WEBHOOK_TIMEOUT', defaultValue: '1800' },
  { key: 'webhookConnectionTimeout', envVar: 'WEBHOOK_CONNECTION_TIMEOUT', defaultValue: '900' },
  { key: 'azureAdClientId', envVar: 'AZURE_AD_CLIENT_ID' },
  { key: 'azureAdClientSecret', envVar: 'AZURE_AD_CLIENT_SECRET' },
  { key: 'azureAdTenantId', envVar: 'AZURE_AD_TENANT_ID' },
  { key: 'serviceDeskKnowledgeBaseUrl', envVar: 'QDRANT_URL' },
  { key: 'serviceDeskKnowledgeBaseApiKey', envVar: 'QDRANT_API_KEY' },
  { key: 'serviceDeskKnowledgeBaseCollectionName', envVar: 'QDRANT_COLLECTION_NAME', defaultValue: 'service_desk_knowledge_chunks' },
  { key: 'serviceDeskKnowledgeBaseRequestTimeoutMs', envVar: 'QDRANT_REQUEST_TIMEOUT_MS', defaultValue: '10000' },
];

export const SAVE_ENV_MAPPINGS: EnvMapping[] = [
  { key: 'geminiApiKey', envVar: 'GOOGLE_API_KEY' },
  { key: 'openaiApiKey', envVar: 'OPENAI_API_KEY' },
  { key: 'deepseekApiKey', envVar: 'DEEPSEEK_API_KEY' },
  { key: 'resumeProcessingWebhookUrl', envVar: 'RESUME_PROCESSING_WEBHOOK_URL' },
  { key: 'resumeProcessingWebhookToken', envVar: 'RESUME_PROCESSING_WEBHOOK_TOKEN' },
  { key: 'resumeProcessingWebhookResponseMode', envVar: 'RESUME_PROCESSING_WEBHOOK_RESPONSE_MODE', defaultValue: 'blocking' },
  { key: 'azureAdClientId', envVar: 'AZURE_AD_CLIENT_ID' },
  { key: 'azureAdClientSecret', envVar: 'AZURE_AD_CLIENT_SECRET' },
  { key: 'azureAdTenantId', envVar: 'AZURE_AD_TENANT_ID' },
  { key: 'serviceDeskKnowledgeBaseUrl', envVar: 'QDRANT_URL' },
  { key: 'serviceDeskKnowledgeBaseApiKey', envVar: 'QDRANT_API_KEY' },
  { key: 'serviceDeskKnowledgeBaseCollectionName', envVar: 'QDRANT_COLLECTION_NAME', defaultValue: 'service_desk_knowledge_chunks' },
  { key: 'serviceDeskKnowledgeBaseRequestTimeoutMs', envVar: 'QDRANT_REQUEST_TIMEOUT_MS', defaultValue: '10000' },
];

export function applyRuntimeEnvironmentFallbacks(settingsObj: SystemSettingsMap, mappings: EnvMapping[]) {
  for (const mapping of mappings) {
    if (mapping.key === 'geminiApiKey' || mapping.key === 'openaiApiKey' || mapping.key === 'deepseekApiKey') {
      continue;
    }

    if (!settingsObj[mapping.key]) {
      const envValue = process.env[mapping.envVar];
      if (envValue) {
        settingsObj[mapping.key] = envValue;
      } else if (mapping.defaultValue) {
        settingsObj[mapping.key] = mapping.defaultValue;
      }
    }
  }

  return settingsObj;
}

export function getMissingEnvironmentSettings(
  settings: SystemSettingRow[],
  mappings: EnvMapping[]
): Array<{ key: string; value: string }> {
  const existingKeys = new Set(settings.map(setting => setting.key));
  const settingsToInsert: Array<{ key: string; value: string }> = [];

  for (const mapping of mappings) {
    if (mapping.key === 'geminiApiKey' || mapping.key === 'openaiApiKey' || mapping.key === 'deepseekApiKey' || existingKeys.has(mapping.key)) {
      continue;
    }

    const envValue = process.env[mapping.envVar];
    if (envValue) {
      settingsToInsert.push({ key: mapping.key, value: envValue });
    } else if (mapping.defaultValue) {
      settingsToInsert.push({ key: mapping.key, value: mapping.defaultValue });
    }
  }

  return settingsToInsert;
}

export function addAzureAdConfigurationStatus(settingsObj: SystemSettingsMap) {
  const azureAdClientId = settingsObj.azureAdClientId || process.env.AZURE_AD_CLIENT_ID;
  const azureAdClientSecret = settingsObj.azureAdClientSecret || process.env.AZURE_AD_CLIENT_SECRET;
  const azureAdTenantId = settingsObj.azureAdTenantId || process.env.AZURE_AD_TENANT_ID;

  settingsObj.isAzureAdConfigured = Boolean(
    azureAdClientId
    && azureAdClientSecret
    && azureAdTenantId
    && azureAdClientId !== 'your_azure_ad_application_client_id'
    && azureAdClientSecret !== 'your_azure_ad_client_secret_value'
    && azureAdTenantId !== 'your_azure_ad_directory_tenant_id'
  );

  return settingsObj;
}
