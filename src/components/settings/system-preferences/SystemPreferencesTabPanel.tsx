import type { ComponentProps } from 'react';

import { AppearanceTab } from './AppearanceTab';
import { BrandingTab } from './BrandingTab';
import { EvaluateTab } from './EvaluateTab';
import { GeneralTab } from './GeneralTab';
import { SidebarTab } from './SidebarTab';
import type { SystemPreferencesTabId } from './SystemPreferencesNavigation';

interface SystemPreferencesTabPanelProps {
  activeTab: SystemPreferencesTabId;
  generalProps: ComponentProps<typeof GeneralTab>;
  appearanceProps: ComponentProps<typeof AppearanceTab>;
  brandingProps: ComponentProps<typeof BrandingTab>;
  sidebarProps: ComponentProps<typeof SidebarTab>;
  evaluateProps: ComponentProps<typeof EvaluateTab>;
}

export function SystemPreferencesTabPanel({
  activeTab,
  generalProps,
  appearanceProps,
  brandingProps,
  sidebarProps,
  evaluateProps,
}: SystemPreferencesTabPanelProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      {activeTab === 'general' && <GeneralTab {...generalProps} />}
      {activeTab === 'appearance' && <AppearanceTab {...appearanceProps} />}
      {activeTab === 'branding' && <BrandingTab {...brandingProps} />}
      {activeTab === 'sidebar' && <SidebarTab {...sidebarProps} />}
      {activeTab === 'evaluate' && <EvaluateTab {...evaluateProps} />}
    </div>
  );
}
