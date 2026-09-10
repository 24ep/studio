"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CpuChipIcon as BrainCircuit,
  DocumentTextIcon as FileTextIcon,
  FlagIcon as Target,
} from '@heroicons/react/24/outline';
import type { AveragedEvaluationData, GroupedSkill, GroupedTrait } from '../types';
import { formatPersonalityScore } from '../utils';
import { ExpertiseBarSummaryChart, PersonalityRadarSummaryChart } from './ExecutiveSummaryCharts';

export function ExecutiveSummaryHeader() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-600 rounded-lg">
        <FileTextIcon className="h-6 w-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
    </div>
  );
}

interface PersonalitySummaryCardProps {
  averagedEvaluationData: AveragedEvaluationData;
  chartReady: boolean;
  personalityGroups: GroupedTrait[];
}

export function PersonalitySummaryCard({
  averagedEvaluationData,
  chartReady,
  personalityGroups,
}: PersonalitySummaryCardProps) {
  const overallPercentage = averagedEvaluationData.overallScore * 20;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <Badge className="bg-green-100 text-green-800">
            Personality
          </Badge>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(overallPercentage)}%
            </p>
            <p className="text-sm text-gray-600">
              Overall Score ({formatPersonalityScore(averagedEvaluationData.overallScore)}/5)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
          {personalityGroups.length > 0 && chartReady && (
            <div className="h-64 mt-4">
              <PersonalityRadarSummaryChart personalityGroups={personalityGroups} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ExpertiseSummaryCardProps {
  chartReady: boolean;
  expertiseGroups: GroupedSkill[];
  overallAverage: number;
}

export function ExpertiseSummaryCard({
  chartReady,
  expertiseGroups,
  overallAverage,
}: ExpertiseSummaryCardProps) {
  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BrainCircuit className="h-5 w-5 text-blue-600" />
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            Expertise
          </Badge>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">
              {overallAverage.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">
              Average Test Score
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overallAverage}%` }}
              />
            </div>
          </div>
          {chartReady && (
            <div className="h-64 mt-4">
              <ExpertiseBarSummaryChart expertiseGroups={expertiseGroups} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
