"use client";

import { useMemo } from 'react';

import type { Applicant, Position } from '@/lib/types';
import { useChartSetup } from '@/hooks/use-chart-setup';

import { ApplicantsPerPositionBarChart } from './ApplicantsPerPositionBarChart';
import {
  ApplicantsPerPositionCard,
  ApplicantsPerPositionEmptyState,
  ApplicantsPerPositionErrorState,
  ApplicantsPerPositionHeader,
  ApplicantsPerPositionLoadingState,
  ApplicantsPerPositionSummary,
} from './ApplicantsPerPositionChartParts';
import {
  buildApplicantsPerPositionData,
  getApplicantsPerPositionTotal,
} from './applicants-per-position-utils';

interface ApplicantsPerPositionChartProps {
  applicants: Applicant[];
  positions: Position[];
}

export function ApplicantsPerPositionChart({ applicants, positions }: ApplicantsPerPositionChartProps) {
  const { chartReady, error: chartError } = useChartSetup();
  const data = useMemo(
    () => buildApplicantsPerPositionData(applicants, positions),
    [applicants, positions]
  );
  const totalApplicants = useMemo(() => getApplicantsPerPositionTotal(data), [data]);

  return (
    <div className="space-y-6">
      <ApplicantsPerPositionHeader />
      {data.length === 0 ? (
        <ApplicantsPerPositionEmptyState />
      ) : (
        <ApplicantsPerPositionCard
          title="Position Distribution"
          description={`${totalApplicants} total applicants across ${data.length} positions`}
        >
          <div className="h-[400px] w-full">
            {chartError ? (
              <ApplicantsPerPositionErrorState chartError={chartError} />
            ) : !chartReady ? (
              <ApplicantsPerPositionLoadingState />
            ) : (
              <ApplicantsPerPositionBarChart data={data} />
            )}
          </div>
          <ApplicantsPerPositionSummary
            activePositions={data.length}
            totalApplicants={totalApplicants}
          />
        </ApplicantsPerPositionCard>
      )}
    </div>
  );
}
