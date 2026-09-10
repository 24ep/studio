"use client";

import type { RefObject } from 'react';
import dynamic from 'next/dynamic';

import type { Applicant } from '@/lib/types';

import { SLAViolationsWidget } from './SLAViolationsWidget';

const ChartFallback = () => (
  <div className="min-h-[220px] rounded-lg border bg-muted/20" />
);

const ApplicantScoreDistributionChart = dynamic(
  () => import('./ApplicantScoreDistributionChart').then((module) => module.ApplicantScoreDistributionChart),
  {
    ssr: false,
    loading: ChartFallback,
  },
);

const NewApplicationsTimeSeriesChart = dynamic(
  () => import('./NewApplicationsTimeSeriesChart').then((module) => module.NewApplicationsTimeSeriesChart),
  {
    ssr: false,
    loading: ChartFallback,
  },
);

export function DashboardChartsSection({
  applicants,
  canViewAllApplicants,
  dynamicHeight,
  isLoading,
  onDataUpdate,
  recruiterId,
  sharedRef,
}: {
  applicants: Applicant[];
  canViewAllApplicants: boolean;
  dynamicHeight: number;
  isLoading: boolean;
  onDataUpdate: () => void;
  recruiterId?: string;
  sharedRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Recruiting trends</h2>
        <p className="mt-1 text-sm text-muted-foreground">Applications, fit scores, and service-level alerts.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-6">
          <NewApplicationsTimeSeriesChart
            applicants={applicants}
            isLoading={isLoading}
            dynamicHeight={dynamicHeight - 380}
          />

          <ApplicantScoreDistributionChart
            applicants={applicants}
            isLoading={isLoading}
            dynamicHeight={dynamicHeight - 380}
          />
        </div>

        <div className="lg:col-span-5" ref={sharedRef}>
          <div className="relative space-y-4 overflow-y-auto h-full">
            <SLAViolationsWidget onDataUpdate={onDataUpdate} />
            {!canViewAllApplicants && recruiterId && (
              <SLAViolationsWidget recruiterId={recruiterId} onDataUpdate={onDataUpdate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
