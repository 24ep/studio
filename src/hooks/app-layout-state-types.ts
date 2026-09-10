export interface AppLayoutState {
  isClient: boolean;
  appLogoUrl: string | null;
  currentAppName: string;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
  collapsedSidebarLogoSize: number;
  isLogoLoading: boolean;
  contextualLogos: {
    sidebarLogoCollapsedLightMode: string | null;
    sidebarLogoExpandedLightMode: string | null;
    sidebarLogoCollapsedDarkMode: string | null;
    sidebarLogoExpandedDarkMode: string | null;
  };
  themeAndColors: {
    themePreference: string;
    primaryGradient: string | null;
    sidebarColors: Record<string, string>;
  };
}

export const DEFAULT_APP_NAME = "hrive";

export const INITIAL_APP_LAYOUT_STATE: AppLayoutState = {
  isClient: false,
  appLogoUrl: null,
  currentAppName: DEFAULT_APP_NAME,
  showLogoOnly: false,
  sidebarLogoSize: 48,
  collapsedSidebarLogoSize: 40,
  isLogoLoading: false,
  contextualLogos: {
    sidebarLogoCollapsedLightMode: null,
    sidebarLogoExpandedLightMode: null,
    sidebarLogoCollapsedDarkMode: null,
    sidebarLogoExpandedDarkMode: null,
  },
  themeAndColors: {
    themePreference: 'system',
    primaryGradient: null,
    sidebarColors: {},
  },
};

export type AppLayoutConfigUpdates = {
  appLogoUrl?: string | null;
  currentAppName?: string;
  showLogoOnly?: boolean;
  sidebarLogoSize?: number;
  collapsedSidebarLogoSize?: number;
  contextualLogos?: AppLayoutState['contextualLogos'];
};
