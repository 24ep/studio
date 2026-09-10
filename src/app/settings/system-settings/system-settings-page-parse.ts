import type { SystemSettingsViewState } from './system-settings-page-types';
import type { SystemSettingsRecord } from './system-settings-utils';
import {
  parseEmailSettings,
  parseFeatureSettings,
  parseIntegrationSettings,
  parseKnowledgeBaseSettings,
  parseOrganizationSettings,
  parseProcessingSettings,
  parsePwaSettings,
} from './system-settings-page-parse-groups';
export { parseLockoutAlertEmails } from './system-settings-page-parse-utils';

export function parseSystemSettingsViewState(settings: SystemSettingsRecord): SystemSettingsViewState {
  return {
    ...parseProcessingSettings(settings),
    ...parseEmailSettings(settings),
    ...parseOrganizationSettings(settings),
    ...parseIntegrationSettings(settings),
    ...parseKnowledgeBaseSettings(settings),
    ...parsePwaSettings(settings),
    ...parseFeatureSettings(settings),
  };
}
