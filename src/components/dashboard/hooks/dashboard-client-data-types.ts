export interface DashboardMetrics {
  kpis: {
    activeApplicants: number;
    openHeadcounts: number;
    hiredThisMonth: number;
    rejectedThisMonth: number;
    highScoreApplicants: number;
    applicationsThisWeek: number;
    avgTimeToHire: string;
  };
  timeSeries: { date: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  pipelineStages: { stage: string; count: number }[];
  pipelineRecruiters: { recruiter: string; count: number }[];
}

export const DEFAULT_DASHBOARD_METRICS: DashboardMetrics = {
  kpis: {
    activeApplicants: 0,
    openHeadcounts: 0,
    hiredThisMonth: 0,
    rejectedThisMonth: 0,
    highScoreApplicants: 0,
    applicationsThisWeek: 0,
    avgTimeToHire: '0.00',
  },
  timeSeries: [],
  scoreDistribution: [],
  pipelineStages: [],
  pipelineRecruiters: [],
};
