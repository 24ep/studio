"use client";

import type { AveragedEvaluationData, GroupedSkill, GroupedTrait } from '../types';
import {
  ExecutiveSummaryHeader,
  ExpertiseSummaryCard,
  PersonalitySummaryCard,
} from './ExecutiveSummaryParts';
import { getOverallExpertiseAverage } from './executive-summary-utils';

interface ExecutiveSummaryProps {
  averagedEvaluationData: AveragedEvaluationData | null;
  personalityGroups: GroupedTrait[];
  expertiseGroups: GroupedSkill[];
  chartReady: boolean;
}

export function ExecutiveSummary({
  averagedEvaluationData,
  personalityGroups,
  expertiseGroups,
  chartReady,
}: ExecutiveSummaryProps) {
  const overallAverage = getOverallExpertiseAverage(expertiseGroups);

  return (
    <>
      <ExecutiveSummaryHeader />

      <div className="grid grid-cols-1 gap-6">
        {averagedEvaluationData && (
          <PersonalitySummaryCard
            averagedEvaluationData={averagedEvaluationData}
            chartReady={chartReady}
            personalityGroups={personalityGroups}
          />
        )}

        {expertiseGroups.length > 0 && (
          <ExpertiseSummaryCard
            chartReady={chartReady}
            expertiseGroups={expertiseGroups}
            overallAverage={overallAverage}
          />
        )}
      </div>
    </>
  );
}
