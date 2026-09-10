"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BrainCircuit, FileText as FileTextIcon, Target } from 'lucide-react';
import { Bar, Radar } from 'react-chartjs-2';
import type { AveragedEvaluationData, GroupedSkill, GroupedTrait } from '../types';
import { formatPersonalityScore } from '../utils';
import {
  buildExpertiseBarData,
  buildPersonalityRadarData,
  getExpertiseBarOptions,
  getPersonalityRadarOptions,
} from './executive-summary-utils';

export function ExecutiveSummaryHeader() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-600 rounded-lg">
        <FileTextIcon className="h-6 w-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Executive Summary</h2>
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
    <Card className="border-0 md:border shadow-none md:shadow-sm rounded-none md:rounded-lg bg-transparent md:bg-muted/30">
      <CardContent className="p-0 md:p-6">
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
            <p className="text-3xl font-bold text-foreground">
              {Math.round(overallPercentage)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Overall Score ({formatPersonalityScore(averagedEvaluationData.overallScore)}/5)
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
          {personalityGroups.length > 0 && chartReady && (
            <PersonalityRadarChart personalityGroups={personalityGroups} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PersonalityRadarChartProps {
  personalityGroups: GroupedTrait[];
}

function PersonalityRadarChart({ personalityGroups }: PersonalityRadarChartProps) {
  return (
    <div className="h-64 mt-4 flex justify-center">
      <Radar
        data={buildPersonalityRadarData(personalityGroups)}
        options={getPersonalityRadarOptions()}
      />
    </div>
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
    <Card className="border-0 md:border shadow-none md:shadow-sm rounded-none md:rounded-lg bg-transparent md:bg-muted/30">
      <CardContent className="p-0 md:p-6">
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
            <p className="text-3xl font-bold text-foreground">
              {overallAverage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Average Test Score
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overallAverage}%` }}
              />
            </div>
          </div>
          {chartReady && (
            <ExpertiseBarChart expertiseGroups={expertiseGroups} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ExpertiseBarChartProps {
  expertiseGroups: GroupedSkill[];
}

function ExpertiseBarChart({ expertiseGroups }: ExpertiseBarChartProps) {
  return (
    <div className="h-64 mt-4 flex justify-center">
      <Bar
        data={buildExpertiseBarData(expertiseGroups)}
        options={getExpertiseBarOptions()}
      />
    </div>
  );
}
