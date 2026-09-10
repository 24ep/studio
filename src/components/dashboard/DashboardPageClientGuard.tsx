"use client";

import { signIn } from "next-auth/react";

import {
  DashboardAccessRedirectState,
  DashboardAuthErrorState,
  DashboardDataErrorState,
  DashboardLoadingScreen,
  DashboardPermissionIssueState,
} from "./DashboardPageGuardStates";
import {
  getDashboardFallbackRoute,
  shouldRedirectDashboardUnauthenticated,
} from "./dashboard-page-client-utils";

interface DashboardPageClientGuardProps {
  authError: boolean;
  canAccessMyTasks: boolean;
  canViewDashboard: boolean;
  canViewPositions: boolean;
  fetchError: string | null;
  hasDashboardData: boolean;
  initialFetchError?: string;
  isLoading: boolean;
  onGoHome: () => void;
  onReload: () => void;
  onReplace: (href: string) => void;
  permissionError: boolean;
  status: string;
}

export function renderDashboardPageClientGuard({
  authError,
  canAccessMyTasks,
  canViewDashboard,
  canViewPositions,
  fetchError,
  hasDashboardData,
  initialFetchError,
  isLoading,
  onGoHome,
  onReload,
  onReplace,
  permissionError,
  status,
}: DashboardPageClientGuardProps) {
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    const isOnSigninPage =
      typeof window !== "undefined" &&
      window.location.pathname === "/auth/signin";
    const isLogoutInProgress =
      typeof window !== "undefined" &&
      window.location.search.includes("signout=true");

    if (
      shouldRedirectDashboardUnauthenticated({
        isLogoutInProgress,
        isOnSigninPage,
      })
    ) {
      onReplace("/auth/signin");
    }

    return <div>Redirecting to sign in...</div>;
  }

  if (!canViewDashboard) {
    const redirectTo = getDashboardFallbackRoute({
      canAccessMyTasks,
      canViewPositions,
    });

    return (
      <DashboardAccessRedirectState
        redirectTo={redirectTo}
        onRedirect={onReplace}
      />
    );
  }

  if (authError) {
    return (
      <DashboardAuthErrorState
        fetchError={fetchError}
        onSignIn={() =>
          signIn(undefined, { callbackUrl: window.location.pathname })
        }
      />
    );
  }

  if (permissionError) {
    return (
      <DashboardPermissionIssueState
        fetchError={fetchError}
        onGoHome={onGoHome}
        onReload={onReload}
      />
    );
  }

  if (fetchError && !isLoading && initialFetchError) {
    return <DashboardDataErrorState fetchError={fetchError} />;
  }

  if (isLoading && !hasDashboardData) {
    return <DashboardLoadingScreen />;
  }

  return null;
}
