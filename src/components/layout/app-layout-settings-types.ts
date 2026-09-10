export type AppLayoutSettingsRecord = Record<string, unknown>;

export interface AppLayoutContextualLogos {
  sidebarLogoCollapsedLightMode: string | null;
  sidebarLogoExpandedLightMode: string | null;
  sidebarLogoCollapsedDarkMode: string | null;
  sidebarLogoExpandedDarkMode: string | null;
}

export interface AppConfigChangedDetail {
  appName?: string;
  logoUrl?: string | null;
  showLogoOnly?: boolean;
  sidebarLogoSize?: number;
  collapsedSidebarLogoSize?: number;
  sidebarNavigationMode?: unknown;
  sidebarSecondaryGroupLabels?: unknown;
}
