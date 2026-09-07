import type { ComponentType } from "react";
import type {
  HeaderPreviewUserSummary,
  HeaderUserSummary,
} from "./HeaderUserMenu.types";
import type { HeaderUserMenuLabels } from "./header-user-menu-i18n";
import type { HeaderThemePreference } from "./HeaderTypes";

export interface HeaderMobileUserDrawerProps {
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
  onUserSearch: (query: string) => void;
  onStartImpersonation: (userId: string | null, role: string | null) => void;
}

export type MobileThemeOption = {
  id: HeaderThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
};
