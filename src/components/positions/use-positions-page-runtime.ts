"use client";

import { useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { useAutoScrollToInput } from "@/hooks/use-auto-scroll-to-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useJobMatchFeature } from "@/hooks/useJobMatchFeature";
import { buildPositionPagePermissions } from "./position-page-utils";

export function usePositionsPageRuntime() {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  useAutoScrollToInput();

  const {
    positions: preferences,
    updatePositionsPreferences,
    isLoaded: isPreferencesLoaded,
  } = useUserPreferences();
  const { isJobMatchEnabled } = useJobMatchFeature();
  const isUpdatingURLRef = useRef(false);

  const {
    canCreatePositions,
    canAssignPositionRecruiter,
  } = useMemo(
    () => buildPositionPagePermissions(session?.user?.modulePermissions),
    [session?.user?.modulePermissions],
  );

  return {
    canAssignPositionRecruiter,
    canCreatePositions,
    isJobMatchEnabled,
    isMobile,
    isPreferencesLoaded,
    isUpdatingURLRef,
    preferences,
    searchParams,
    session,
    status,
    updatePositionsPreferences,
  };
}
