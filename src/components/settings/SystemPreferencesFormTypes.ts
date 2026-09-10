import type { ChangeEvent } from "react";

import type { ThemePreference } from "./system-preferences/constants";

export interface SystemPreferencesFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export interface SystemPreferencesBasicSettingsCardProps {
  appName: string;
  onAppNameChange: (value: string) => void;
  themePreference: ThemePreference;
  onThemePreferenceChange: (value: ThemePreference) => void;
}

export interface SystemPreferencesLogoSettingsCardProps {
  appLogoUrl: string | null;
  appFaviconUrl: string | null;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
  onAppLogoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAppFaviconUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAppLogo: () => void;
  onRemoveAppFavicon: () => void;
  onShowLogoOnlyChange: (value: boolean) => void;
  onSidebarLogoSizeChange: (value: number) => void;
}

export interface SystemPreferenceImageUploadFieldProps {
  id: string;
  label: string;
  imageUrl: string | null;
  imageAlt: string;
  imageClassName: string;
  accept: string;
  actionLabel: string;
  replacementActionLabel: string;
  helperText: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

