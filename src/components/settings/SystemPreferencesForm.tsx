"use client";

import { SystemPreferencesBasicSettingsCard } from "./SystemPreferencesBasicSettingsCard";
import { SystemPreferencesFormActions } from "./SystemPreferencesFormActions";
import { SystemPreferencesLogoSettingsCard } from "./SystemPreferencesLogoSettingsCard";
import {
  SystemPreferencesAccessState,
  SystemPreferencesLoadingState,
} from "./SystemPreferencesFormStates";
import type { SystemPreferencesFormProps } from "./SystemPreferencesFormTypes";
import { useSystemPreferencesForm } from "./use-system-preferences-form";

export function SystemPreferencesForm({ onSave, onCancel }: SystemPreferencesFormProps) {
  const preferences = useSystemPreferencesForm({ onSave });

  if (preferences.isLoadingView) {
    return <SystemPreferencesLoadingState message={preferences.loadingMessage} />;
  }

  if (preferences.sessionStatus === "unauthenticated") {
    return (
      <SystemPreferencesAccessState
        title="Access Denied"
        description="You need to be logged in to access system preferences."
      />
    );
  }

  if (!preferences.canEdit) {
    return (
      <SystemPreferencesAccessState
        title="Insufficient Permissions"
        description="You don't have permission to access system preferences. Contact your administrator for access."
      />
    );
  }

  return (
    <div className="space-y-6">
      <SystemPreferencesBasicSettingsCard
        appName={preferences.appName}
        onAppNameChange={preferences.setAppName}
        themePreference={preferences.themePreference}
        onThemePreferenceChange={preferences.setThemePreference}
      />

      <SystemPreferencesLogoSettingsCard
        appLogoUrl={preferences.appLogoUrl}
        appFaviconUrl={preferences.appFaviconUrl}
        showLogoOnly={preferences.showLogoOnly}
        sidebarLogoSize={preferences.sidebarLogoSize}
        onAppLogoUpload={preferences.handleLogoUpload}
        onAppFaviconUpload={preferences.handleFaviconUpload}
        onRemoveAppLogo={() => preferences.setAppLogoUrl(null)}
        onRemoveAppFavicon={() => preferences.setAppFaviconUrl(null)}
        onShowLogoOnlyChange={preferences.setShowLogoOnly}
        onSidebarLogoSizeChange={preferences.setSidebarLogoSize}
      />

      <SystemPreferencesFormActions
        isSaving={preferences.isSaving || preferences.isActioning}
        onCancel={onCancel}
        onSave={preferences.handleProtectedSave}
      />
    </div>
  );
}
