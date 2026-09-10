"use client";

import dynamic from 'next/dynamic';

const DashboardPipelineChartCard = dynamic(
  () => import('./DashboardPipelineChartCard').then((module) => module.DashboardPipelineChartCard),
  {
    ssr: false,
    loading: () => <div className="min-h-[220px] rounded-lg border bg-muted/20" />,
  },
);

export function DashboardPipelineAnalyticsSection({
  hasSSEUpdated,
  isLoading,
  isPageRefresh,
  onProcessByRecruiter,
  onProcessByStage,
}: {
  hasSSEUpdated: boolean;
  isLoading: boolean;
  isPageRefresh: boolean;
  onProcessByRecruiter: Record<string, number>;
  onProcessByStage: Record<string, number>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pipeline analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Applicant distribution and recruiter workload.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardPipelineChartCard
          title="On-Process Applicants by Stage"
          description="Current pipeline distribution"
          counts={onProcessByStage}
          isLoading={isLoading}
          isPageRefresh={isPageRefresh}
          hasSSEUpdated={hasSSEUpdated}
        />
        <DashboardPipelineChartCard
          title="On-Process Applicants by Recruiter"
          description="Current recruiter workload"
          counts={onProcessByRecruiter}
          isLoading={isLoading}
          isPageRefresh={isPageRefresh}
          hasSSEUpdated={hasSSEUpdated}
          colorScheme="score"
          tickFontSize={13}
        />
      </div>
    </div>
  );
}
