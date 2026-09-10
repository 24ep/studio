"use client";

import { SystemSettingsCoreTabPanels } from './SystemSettingsCoreTabPanels';
import { SystemSettingsToolTabPanels } from './SystemSettingsToolTabPanels';
import type { SystemSettingsTabContentProps } from './SystemSettingsTabContentTypes';

export function SystemSettingsTabContent({ settingsPage }: SystemSettingsTabContentProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <SystemSettingsCoreTabPanels settingsPage={settingsPage} />
      <SystemSettingsToolTabPanels settingsPage={settingsPage} />
    </div>
  );
}
