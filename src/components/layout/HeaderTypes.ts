import type { HeaderPreviewUserSummary, HeaderUserSummary } from "./HeaderUserMenu.types";
import type { AppLayoutContextualLogos } from "./app-layout-settings";
import type { HeaderUserMenuLabels } from "./header-user-menu-i18n";

export type HeaderThemePreference = "light" | "dark" | "system";

export interface HeaderProps {
  pageTitle: string;
  showLogoOnly?: boolean;
  appLogoUrl?: string | null;
  currentAppName?: string;
  contextualLogos?: Partial<AppLayoutContextualLogos>;
  isLogoLoading?: boolean;
}

export interface HeaderUserMenuSharedProps {
  labels: HeaderUserMenuLabels;
  user: HeaderUserSummary;
  refreshAvatar: boolean;
  currentTheme: "light" | "dark";
  themePreference: HeaderThemePreference;
  currentLocale: "en-US" | "th-TH";
  isAdminPreviewEnabled: boolean;
  previewUsers: HeaderPreviewUserSummary[];
  isSearchingUsers: boolean;
  onOpenProfile: () => void;
  onOpenSecurity: () => void;
  onClearCache: () => void;
  onThemeChange: (theme: HeaderThemePreference) => void | Promise<void>;
  onLocaleChange: (locale: "en-US" | "th-TH") => void;
  onSignOut: () => void;
  onUserSearch: (query: string) => Promise<void>;
  onStartImpersonation: (userId: string | null, role: string | null) => Promise<void>;
}
