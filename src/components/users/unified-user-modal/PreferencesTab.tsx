import type { UserPreferences } from '@/hooks/use-user-preferences';
import {
  PreferencesInterfaceSettings,
  PreferencesTaskBoardCards,
} from './PreferencesTabParts';
import type { UnifiedUserPreferenceUpdates } from './types';

interface PreferencesTabProps {
  preferences: UserPreferences | null;
  updatePreferenceInDB: (modelType: string, updates: UnifiedUserPreferenceUpdates) => Promise<void>;
  handleResetPreference: (modelType: string) => Promise<void>;
  sidebarShowAssigned: boolean;
  saveSidebarPref: (checked: boolean) => Promise<void>;
  isPrefsLoading: boolean;
}

export function PreferencesTab({
  preferences,
  updatePreferenceInDB,
  handleResetPreference,
  sidebarShowAssigned,
  saveSidebarPref,
  isPrefsLoading,
}: PreferencesTabProps) {
  return (
    <div className="space-y-4 mt-2 focus-visible:ring-0 focus-visible:outline-none">
      <PreferencesInterfaceSettings
        handleResetPreference={handleResetPreference}
        isPrefsLoading={isPrefsLoading}
        preferences={preferences}
        saveSidebarPref={saveSidebarPref}
        sidebarShowAssigned={sidebarShowAssigned}
        updatePreferenceInDB={updatePreferenceInDB}
      />
      <PreferencesTaskBoardCards
        handleResetPreference={handleResetPreference}
        preferences={preferences}
        updatePreferenceInDB={updatePreferenceInDB}
      />
    </div>
  );
}
