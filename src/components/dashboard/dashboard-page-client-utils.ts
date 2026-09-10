import type { Applicant, Position } from "../../lib/types";
import {
  buildDashboardStats,
  buildPipelineCounts,
  calculateAverageTimeToHire,
} from "./dashboard-page-utils";
import type { DashboardMetrics } from "./hooks/use-dashboard-client-data";

export function getDashboardFallbackRoute({
  canAccessMyTasks,
  canViewPositions,
}: {
  canAccessMyTasks: boolean;
  canViewPositions: boolean;
}) {
  if (canAccessMyTasks) {
    return "/my-tasks";
  }

  if (canViewPositions) {
    return "/positions";
  }

  return "/applicants";
}

export function shouldRedirectDashboardUnauthenticated({
  isLogoutInProgress,
  isOnSigninPage,
}: {
  isLogoutInProgress: boolean;
  isOnSigninPage: boolean;
}) {
  return !isOnSigninPage && !isLogoutInProgress;
}

export function buildDashboardClientDerivedData({
  allPositions,
  filteredApplicants,
  hiredStageId,
  metrics,
  myAssignedApplicants,
  myBacklogApplicants,
  recruiterId,
}: {
  allPositions: Position[];
  filteredApplicants: Applicant[];
  hiredStageId?: string;
  metrics?: DashboardMetrics | null;
  myAssignedApplicants: Applicant[];
  myBacklogApplicants: Applicant[];
  recruiterId?: string | null;
}) {
  const safeFilteredApplicants = Array.isArray(filteredApplicants)
    ? filteredApplicants
    : [];
  const safeAllPositions = Array.isArray(allPositions) ? allPositions : [];
  const safeMyAssignedApplicants = Array.isArray(myAssignedApplicants)
    ? myAssignedApplicants
    : [];
  const safeMyBacklogApplicants = Array.isArray(myBacklogApplicants)
    ? myBacklogApplicants
    : [];

  return {
    averageTimeToHire: calculateAverageTimeToHire(
      safeFilteredApplicants,
      hiredStageId,
    ),
    dashboardStats: buildDashboardStats({
      applicants: safeFilteredApplicants,
      positions: safeAllPositions,
      myAssignedApplicants: safeMyAssignedApplicants,
      myBacklogApplicants: safeMyBacklogApplicants,
      metrics,
      recruiterId,
    }),
    onProcessByRecruiter: buildPipelineCounts(metrics?.pipelineRecruiters),
    onProcessByStage: buildPipelineCounts(metrics?.pipelineStages),
  };
}
