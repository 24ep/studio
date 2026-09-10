"use client";

import { Card } from '@/components/ui/card';
import { getScoreColorInfo } from '@/components/ui/score-color';
import { ChevronDownIcon as ChevronDown, ChevronRightIcon as ChevronRight } from '@heroicons/react/24/outline';
import type { EvaluationRecord, GroupedTrait } from '../types';
import { getEvaluatorsForGroup } from '../utils';
import {
  getPersonalityGroupAverageScore,
} from './personality-evaluation-utils';
import { PersonalityTraitScoreTable } from './PersonalityTraitScoreTable';

interface PersonalityGroupListProps {
  personalityGroups: GroupedTrait[];
  allEvaluations: EvaluationRecord[];
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}

export function PersonalityGroupList({
  personalityGroups,
  allEvaluations,
  expandedGroups,
  toggleGroup,
}: PersonalityGroupListProps) {
  return (
    <div className="space-y-3">
      {personalityGroups.map((group) => (
        <PersonalityGroupCard
          key={group.groupId}
          allEvaluations={allEvaluations}
          group={group}
          isExpanded={expandedGroups.has(group.groupId)}
          toggleGroup={toggleGroup}
        />
      ))}
    </div>
  );
}

interface PersonalityGroupCardProps {
  group: GroupedTrait;
  allEvaluations: EvaluationRecord[];
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

function PersonalityGroupCard({
  group,
  allEvaluations,
  isExpanded,
  toggleGroup,
}: PersonalityGroupCardProps) {
  const evaluators = isExpanded ? getEvaluatorsForGroup(group, allEvaluations) : [];

  return (
    <Card className="shadow-sm border border-gray-200">
      <PersonalityGroupHeader
        group={group}
        isExpanded={isExpanded}
        toggleGroup={toggleGroup}
      />
      {isExpanded && evaluators.length > 0 && (
        <PersonalityTraitScoreTable
          allEvaluations={allEvaluations}
          evaluators={evaluators}
          group={group}
        />
      )}
    </Card>
  );
}

interface PersonalityGroupHeaderProps {
  group: GroupedTrait;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

function PersonalityGroupHeader({
  group,
  isExpanded,
  toggleGroup,
}: PersonalityGroupHeaderProps) {
  const averageScore = getPersonalityGroupAverageScore(group);
  const colorInfo = getScoreColorInfo(averageScore);
  const ExpansionIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={() => toggleGroup(group.groupId)}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors no-print rounded-t-lg"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <ExpansionIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.groupColor }}
        />
        <span className="text-sm font-semibold text-gray-900 truncate">
          {group.groupName}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-500">Average</p>
          <p className={`text-sm font-bold ${colorInfo.text}`}>
            {averageScore.toFixed(1)}%
          </p>
        </div>
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${averageScore}%`,
              backgroundColor: group.groupColor,
            }}
          />
        </div>
      </div>
    </button>
  );
}
