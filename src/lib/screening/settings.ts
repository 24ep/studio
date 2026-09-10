import { getSystemSetting } from '@/lib/systemSettings';
import type { ScreeningSettings } from './types';

function booleanSetting(value: string | null, fallback: boolean) {
  return value === null ? fallback : value === 'true';
}

function numberSetting(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function getScreeningSettings(): Promise<ScreeningSettings> {
  const [enabled, auto, aiAllowed, manualAi, automaticAi, sources, maxQueries, maxResults, monthlyLimit, retention, threshold, braveApiKey] = await Promise.all([
    getSystemSetting('screeningEnabled'),
    getSystemSetting('screeningAutoApplicantEnabled'),
    getSystemSetting('screeningAiAllowed'),
    getSystemSetting('screeningManualAiDefault'),
    getSystemSetting('screeningAutomaticAiDefault'),
    getSystemSetting('screeningEnabledSources'),
    getSystemSetting('screeningMaxQueries'),
    getSystemSetting('screeningMaxResultsPerQuery'),
    getSystemSetting('screeningMonthlyQueryLimit'),
    getSystemSetting('screeningRetentionDays'),
    getSystemSetting('screeningIdentityThreshold'),
    getSystemSetting('screeningBraveApiKey'),
  ]);

  return {
    enabled: booleanSetting(enabled, false),
    autoApplicantEnabled: booleanSetting(auto, false),
    aiAllowed: booleanSetting(aiAllowed, false),
    manualAiDefault: booleanSetting(manualAi, false),
    automaticAiDefault: booleanSetting(automaticAi, false),
    enabledSources: (sources || 'brave,gdelt,un,ofac,uk,thai_sec').split(',').map(item => item.trim()).filter(Boolean),
    maxQueries: numberSetting(maxQueries, 5, 1, 10),
    maxResultsPerQuery: numberSetting(maxResults, 10, 1, 20),
    monthlyQueryLimit: numberSetting(monthlyLimit, 1000, 1, 100000),
    retentionDays: numberSetting(retention, 180, 1, 3650),
    identityThreshold: numberSetting(threshold, 0.8, 0.5, 1),
    braveConfigured: Boolean(braveApiKey),
  };
}

export async function getBraveSearchApiKey() {
  return getSystemSetting('screeningBraveApiKey');
}
