"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  MyTasksLoadingState,
  MyTasksMobileUnavailableState,
} from "@/components/tasks/MyTasksPageStates";
import { MyTasksPageClientView } from "./MyTasksPageClientView";
import type { MyTasksPageClientProps } from "./MyTasksPageClientTypes";
import { useMyTasksPageClient } from "./use-my-tasks-page-client";
import { useLocalization } from '@/contexts/LocalizationContext';

export function MyTasksPageClient({
  embedded = false,
  headerLeading,
  headerTrailing,
  userSession,
}: MyTasksPageClientProps) {
  const isMobile = useIsMobile();
  const page = useMyTasksPageClient({ userSession });
  const { t } = useLocalization();

  if (page.isAuthLoading) {
    return <MyTasksLoadingState message={t("common.loading", "Loading...")} />;
  }

  if (!page.isAuthenticated) {
    return <MyTasksLoadingState message={t("auth.redirecting", "Redirecting to sign in...")} />;
  }

  if (isMobile) {
    return <MyTasksMobileUnavailableState />;
  }

  if (!page.metadataLoaded) {
    return (
      <MyTasksLoadingState
        embedded={embedded}
        message={t("tasks.loadingPreferences", "Loading your board preferences...")}
        variant="board"
      />
    );
  }

  return (
    <MyTasksPageClientView
      actions={page.actions}
      embedded={embedded}
      headerLeading={headerLeading}
      headerTrailing={headerTrailing}
      searchInputRef={page.searchInputRef}
      state={page.state}
    />
  );
}
