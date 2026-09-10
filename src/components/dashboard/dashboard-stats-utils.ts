import type { Applicant, Position } from '../../lib/types';
import {
  isApplicantActive,
  isApplicantApplicationToday,
} from './dashboard-applicant-filter-utils';
import { getOpenPositionsWithNoApplicants } from './dashboard-list-utils';

type DashboardMetricsLike = {
  kpis?: {
    activeApplicants?: number;
    openHeadcounts?: number;
    hiredThisMonth?: number;
    rejectedThisMonth?: number;
    applicationsThisWeek?: number;
  };
  pipelineRecruiters?: Array<{ recruiter: string; count: number }>;
};

function isApplicantInInterview(applicant: Pick<Applicant, 'status'>) {
  return applicant.status === 'Interview Scheduled' || applicant.status === 'Interviewing';
}

export function buildDashboardStats({
  applicants,
  positions,
  myAssignedApplicants,
  myBacklogApplicants,
  metrics,
  recruiterId,
}: {
  applicants: Applicant[];
  positions: Position[];
  myAssignedApplicants: Applicant[];
  myBacklogApplicants: Applicant[];
  metrics?: DashboardMetricsLike | null;
  recruiterId?: string | null;
}) {
  const openPositions = positions.filter(position => position.isOpen);
  const myActiveApplicantsList = myAssignedApplicants.filter(isApplicantActive);
  const newApplicantsAssignedToMeTodayList = myActiveApplicantsList.filter(isApplicantApplicationToday);

  return {
    totalActiveApplicants: metrics?.kpis?.activeApplicants ?? 0,
    totalOpenPositions: metrics?.kpis?.openHeadcounts ?? 0,
    openPositions,
    hiredThisMonthAdmin: metrics?.kpis?.hiredThisMonth ?? 0,
    rejectedThisMonthAdmin: metrics?.kpis?.rejectedThisMonth ?? 0,
    totalActiveRecruiter: (metrics?.pipelineRecruiters || []).length,
    newApplicantsTodayAdminList: applicants.filter(isApplicantApplicationToday),
    openPositionsWithNoApplicants: getOpenPositionsWithNoApplicants(positions, applicants),
    myActiveApplicantsList,
    myApplicantsInInterviewCount: myActiveApplicantsList.filter(isApplicantInInterview).length,
    newApplicantsAssignedToMeTodayList,
    myActionItemsList: myBacklogApplicants.filter(applicant => applicant?.recruiterId === recruiterId),
  };
}
