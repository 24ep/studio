"use client";

import type { ComponentProps } from "react";

import { SystemPreferencesHeader } from "@/components/settings/system-preferences/SystemPreferencesHeader";
import { SystemPreferencesNavigation } from "@/components/settings/system-preferences/SystemPreferencesNavigation";
import { SystemPreferencesTabPanel } from "@/components/settings/system-preferences/SystemPreferencesTabPanel";

export interface SystemPreferencesPageViewProps {
  headerProps: ComponentProps<typeof SystemPreferencesHeader>;
  isEmbedded: boolean;
  navigationProps: ComponentProps<typeof SystemPreferencesNavigation>;
  tabPanelProps: ComponentProps<typeof SystemPreferencesTabPanel>;
}

export function SystemPreferencesPageView({
  headerProps,
  isEmbedded,
  navigationProps,
  tabPanelProps,
}: SystemPreferencesPageViewProps) {
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${isEmbedded ? "p-4" : "p-6"}`}>
      {!isEmbedded && <SystemPreferencesHeader {...headerProps} />}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!isEmbedded && <SystemPreferencesNavigation {...navigationProps} />}
        <SystemPreferencesTabPanel {...tabPanelProps} />
      </div>
    </div>
  );
}
