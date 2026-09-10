// src/components/dashboard/DashboardPageClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import type { Applicant, Position, UserProfile } from "@/lib/types";
import { hasPermission, isAdminUser } from "@/lib/permissions";
import { useDynamicHeight } from "@/hooks/use-dynamic-height";
import {
  DashboardMainContent,
} from "./DashboardPageClientParts";
import { renderDashboardPageClientGuard } from "./DashboardPageClientGuard";
import { buildDashboardClientDerivedData } from "./dashboard-page-client-utils";
import { useDashboardAnimationFlags } from "./hooks/use-dashboard-animation-flags";
import {
  type DashboardMetrics,
  useDashboardClientData,
} from "./hooks/use-dashboard-client-data";
import { useDashboardRealtimeRefresh } from "./hooks/use-dashboard-realtime-refresh";
export type { DashboardMetrics } from "./hooks/use-dashboard-client-data";

interface DashboardPageClientProps {
  initialApplicants: Applicant[];
  initialPositions: Position[];
  initialUsers: UserProfile[];
  initialMetrics?: DashboardMetrics;
  initialFetchError?: string;
  authError?: boolean;
  permissionError?: boolean;
  initialStageIds: Record<string, string | undefined>;
  initialStageNames: Record<string, string>;
}

export default function DashboardPageClient({
  initialApplicants,
  initialPositions,
  initialUsers,
  initialMetrics,
  initialFetchError,
  authError: serverAuthError = false,
  permissionError: serverPermissionError = false,
  initialStageIds,
  initialStageNames,
}: DashboardPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { height: sharedHeight, elementRef: sharedRef } = useDynamicHeight({
    minHeight: 400,
    maxHeight: 1200,
  });
  const { hasSSEUpdated, isPageRefresh, setHasSSEUpdated } = useDashboardAnimationFlags();
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);

  const {
    allUsers,
    allPositions,
    authError,
    fetchDataClientSide,
    fetchError,
    filteredApplicants,
    headcountData,
    headcountLoading,
    isLoading,
    metrics,
    myAssignedApplicants,
    myBacklogApplicants,
    permissionError,
    stageNames,
  } = useDashboardClientData({
    initialApplicants,
    initialPositions,
    initialUsers,
    initialMetrics,
    initialFetchError,
    serverAuthError,
    serverPermissionError,
    initialStageNames,
    status,
    sessionUser: session?.user,
  });

  const canViewDashboard = hasPermission(session?.user, "DASHBOARD_VIEW");
  const canViewAllApplicants = hasPermission(session?.user, "applicantS_VIEW");
  const canAccessMyTasks =
    hasPermission(session?.user, "TASK_BOARD_MANAGE_OWN") ||
    hasPermission(session?.user, "TASK_BOARD_VIEW") ||
    canViewAllApplicants;
  const canViewPositions = hasPermission(session?.user, "POSITIONS_VIEW");
  const isAdminLike = isAdminUser(session?.user) || hasPermission(session?.user, "SYSTEM_SETTINGS_VIEW");

  useDashboardRealtimeRefresh({
    status,
    sessionUserId: session?.user?.id,
    isLoading,
    fetchDataClientSide,
    setHasSSEUpdated,
  });

  const {
    averageTimeToHire,
    dashboardStats,
    onProcessByRecruiter,
    onProcessByStage,
  } = useMemo(() => buildDashboardClientDerivedData({
    allPositions,
    filteredApplicants,
    hiredStageId: initialStageIds.hired,
    metrics,
    myAssignedApplicants,
    myBacklogApplicants,
    recruiterId: session?.user?.id,
  }), [
    allPositions,
    filteredApplicants,
    initialStageIds.hired,
    metrics,
    myAssignedApplicants,
    myBacklogApplicants,
    session?.user?.id,
  ]);

  const guardContent = renderDashboardPageClientGuard({
    authError,
    canAccessMyTasks,
    canViewDashboard,
    canViewPositions,
    fetchError,
    hasDashboardData: filteredApplicants.length > 0 || allPositions.length > 0,
    initialFetchError,
    isLoading,
    onGoHome: () => router.push("/"),
    onReload: () => window.location.reload(),
    onReplace: (href) => router.replace(href),
    permissionError,
    status,
  });

  if (guardContent) {
    return guardContent;
  }

  return (
    <DashboardMainContent
      pageMode={pathname === "/hr-dashboard" ? "hr" : "admin"}
      activeApplicants={metrics?.kpis?.activeApplicants ?? 0}
      applicationsThisWeek={metrics?.kpis?.applicationsThisWeek ?? 0}
      adminPositionsCount={allPositions.length}
      averageTimeToHire={averageTimeToHire}
      canViewAllApplicants={canViewAllApplicants}
      isAdminPortal={isAdminLike}
      filteredApplicants={filteredApplicants}
      hasSSEUpdated={hasSSEUpdated}
      headcountData={headcountData}
      headcountLoading={headcountLoading}
      adminUsersCount={allUsers.length}
      highScoreApplicants={metrics?.kpis?.highScoreApplicants ?? 0}
      hiredThisMonth={dashboardStats.hiredThisMonthAdmin}
      isLoading={isLoading}
      isPageRefresh={isPageRefresh}
      myActionItemsList={dashboardStats.myActionItemsList}
      myActiveApplicantsCount={dashboardStats.myActiveApplicantsList.length}
      myApplicantsInInterviewCount={dashboardStats.myApplicantsInInterviewCount}
      newApplicantsAssignedToMeTodayList={dashboardStats.newApplicantsAssignedToMeTodayList}
      onDataUpdate={fetchDataClientSide}
      onNavigate={(href) => router.push(href)}
      onPositionClick={(positionId) => {
        setSelectedPositionId(positionId);
        setIsPositionDrawerOpen(true);
      }}
      onPositionDrawerOpenChange={setIsPositionDrawerOpen}
      onSelectedPositionIdChange={setSelectedPositionId}
      onProcessByRecruiter={onProcessByRecruiter}
      onProcessByStage={onProcessByStage}
      openHeadcounts={metrics?.kpis?.openHeadcounts ?? 0}
      positionDrawerOpen={isPositionDrawerOpen}
      recruiterId={session?.user?.id}
      rejectedThisMonth={dashboardStats.rejectedThisMonthAdmin}
      selectedPositionId={selectedPositionId}
      sharedHeight={sharedHeight}
      sharedRef={sharedRef}
      stageNames={stageNames}
    />
  );
}
