"use client";

import { Bar, Radar } from 'react-chartjs-2';
import type { GroupedSkill, GroupedTrait } from '../types';
import {
  buildExpertiseBarData,
  buildExpertiseBarOptions,
  buildPersonalityRadarData,
  buildPersonalityRadarOptions,
} from './executive-summary-utils';

interface PersonalityRadarSummaryChartProps {
  personalityGroups: GroupedTrait[];
}

export function PersonalityRadarSummaryChart({
  personalityGroups,
}: PersonalityRadarSummaryChartProps) {
  return (
    <Radar
      data={buildPersonalityRadarData(personalityGroups)}
      options={buildPersonalityRadarOptions()}
    />
  );
}

interface ExpertiseBarSummaryChartProps {
  expertiseGroups: GroupedSkill[];
}

export function ExpertiseBarSummaryChart({
  expertiseGroups,
}: ExpertiseBarSummaryChartProps) {
  return (
    <Bar
      data={buildExpertiseBarData(expertiseGroups)}
      options={buildExpertiseBarOptions()}
    />
  );
}
