"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import {
  AppearancePreferencesTab,
  AccessibilityPreferencesTab,
  PositionsPreferencesTab,
  SidebarPreferencesTab,
  TaskBoardPreferencesTab,
  UserPreferencesAuthRequiredState,
  UserPreferencesHeader,
  UserPreferencesInfoCard,
  UserPreferencesLoadingState,
  UserPreferencesTabs,
  type UserPreferencesTab,
} from './UserPreferencesPageParts';

export default function UserPreferencesPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<UserPreferencesTab>('appearance');
  const {
    preferences,
    updateTaskBoardPreferences,
    updateAppearancePreferences,
    updateSidebarPreferences,
    updateAccessibilityPreferences,
    resetTaskBoardPreferences,
    resetPositionsPreferences,
    resetAppearancePreferences,
    resetSidebarPreferences,
    resetAccessibilityPreferences,
    resetAllPreferences,
    isLoaded,
    isLoading,
    isAuthenticated,
  } = useUserPreferences();

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && ['appearance', 'accessibility', 'taskboard', 'positions', 'sidebar', 'security'].includes(tab)) {
      setActiveTab(tab as UserPreferencesTab);
    }
  }, []);

  const memoizedTaskBoardPreferences = useMemo(() => preferences.taskBoard, [
    preferences.taskBoard.cardWidth,
    preferences.taskBoard.customCardWidth,
    preferences.taskBoard.showAvatar,
    preferences.taskBoard.showName,
    preferences.taskBoard.showEmail,
    preferences.taskBoard.showDescription,
    preferences.taskBoard.showFitScore,
    preferences.taskBoard.showAssignee,
    preferences.taskBoard.showPriority,
    preferences.taskBoard.showDueDate,
    preferences.taskBoard.showTags,
    preferences.taskBoard.showSkills,
    preferences.taskBoard.showJobApplied,
    preferences.taskBoard.searchTerm,
    preferences.taskBoard.filterPriority,
    preferences.taskBoard.filterAssignee,
    preferences.taskBoard.selectedStages,
    preferences.taskBoard.viewMode,
  ]);

  const handleResetAll = async () => {
    try {
      await resetAllPreferences();
      toast.success('All preferences reset to defaults');
    } catch {
      toast.error('Failed to reset preferences');
    }
  };

  const handleResetTaskBoard = async () => {
    try {
      await resetTaskBoardPreferences();
      toast.success('Task board preferences reset to defaults');
    } catch {
      toast.error('Failed to reset task board preferences');
    }
  };

  const handleResetPositions = async () => {
    try {
      await resetPositionsPreferences();
      toast.success('Positions preferences reset to defaults');
    } catch {
      toast.error('Failed to reset positions preferences');
    }
  };

  const handleResetAppearance = async () => {
    try {
      await resetAppearancePreferences();
      toast.success('Appearance preferences reset to defaults');
    } catch {
      toast.error('Failed to reset appearance preferences');
    }
  };

  const handleResetSidebar = async () => {
    try {
      await resetSidebarPreferences();
      toast.success('Sidebar preferences reset to defaults');
    } catch {
      toast.error('Failed to reset sidebar preferences');
    }
  };

  const handleResetAccessibility = async () => {
    try {
      await resetAccessibilityPreferences();
      toast.success('Accessibility preferences reset to defaults');
    } catch {
      toast.error('Failed to reset accessibility preferences');
    }
  };

  if (status === 'loading' || isLoading) {
    return <UserPreferencesLoadingState message="Loading preferences..." />;
  }

  if (!isAuthenticated) {
    return <UserPreferencesAuthRequiredState />;
  }

  if (!isLoaded) {
    return <UserPreferencesLoadingState message="Loading your preferences..." />;
  }

  return (
    <div className="container mx-auto py-4 space-y-4">
      <UserPreferencesHeader onResetAll={handleResetAll} />

      <div className="space-y-4">
        <UserPreferencesTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'appearance' && (
          <AppearancePreferencesTab
            preferences={preferences.appearance}
            onColorChange={(personalColor) => updateAppearancePreferences({ personalColor })}
            onThemeChange={(themePreference) => updateAppearancePreferences({ themePreference })}
            onReset={handleResetAppearance}
          />
        )}

        {activeTab === 'accessibility' && (
          <AccessibilityPreferencesTab
            preferences={preferences.accessibility}
            onUpdate={updateAccessibilityPreferences}
            onReset={handleResetAccessibility}
          />
        )}

        {activeTab === 'taskboard' && (
          <TaskBoardPreferencesTab
            preferences={memoizedTaskBoardPreferences}
            onUpdatePreferences={updateTaskBoardPreferences}
            onReset={handleResetTaskBoard}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsPreferencesTab
            preferences={preferences.positions}
            onReset={handleResetPositions}
          />
        )}

        {activeTab === 'sidebar' && (
          <SidebarPreferencesTab
            preferences={preferences.sidebar}
            onUpdatePreferences={updateSidebarPreferences}
            onReset={handleResetSidebar}
          />
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto py-4">
            <TwoFactorSetup onComplete={() => window.location.reload()} />
          </div>
        )}
      </div>

      <UserPreferencesInfoCard />
    </div>
  );
}
