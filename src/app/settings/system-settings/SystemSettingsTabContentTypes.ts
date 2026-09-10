import type { useSystemSettingsPage } from './use-system-settings-page';

export type SystemSettingsPageState = ReturnType<typeof useSystemSettingsPage>;

export interface SystemSettingsTabContentProps {
  settingsPage: SystemSettingsPageState;
}
