export const MASKED_SYSTEM_SETTING_VALUE = '••••••••';

export const SECRET_SYSTEM_SETTING_KEYS = new Set([
  'azureAdClientSecret',
  'appkitApiKey',
  'broadcastSmsTwilioAuthToken',
  'broadcastSmsWebhookToken',
  'emailSmtpPassword',
  'emailApiKey',
  'serviceDeskKnowledgeBaseApiKey',
  'resumeProcessingWebhookToken',
  'screeningBraveApiKey',
]);

export function maskSystemSettingSecrets<T extends Record<string, unknown>>(settings: T) {
  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      SECRET_SYSTEM_SETTING_KEYS.has(key) && typeof value === 'string' && value
        ? MASKED_SYSTEM_SETTING_VALUE
        : value,
    ])
  ) as T;
}
