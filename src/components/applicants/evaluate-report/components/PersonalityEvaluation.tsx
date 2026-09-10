"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlagIcon as Target, ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/outline';
import type { AveragedEvaluationData, EvaluationRecord, GroupedTrait } from '../types';
import { PersonalityGroupList } from './PersonalityEvaluationParts';

interface PersonalityEvaluationProps {
  personalityGroups: GroupedTrait[];
  averagedEvaluationData: AveragedEvaluationData | null;
  allEvaluations: EvaluationRecord[];
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}

export function PersonalityEvaluation({
  personalityGroups,
  averagedEvaluationData,
  allEvaluations,
  expandedGroups,
  toggleGroup,
}: PersonalityEvaluationProps) {
  if (personalityGroups.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <Target className="h-5 w-5 text-purple-600" />
        Personality Evaluation
      </h3>

      {averagedEvaluationData ? (
        <PersonalityGroupList
          allEvaluations={allEvaluations}
          expandedGroups={expandedGroups}
          personalityGroups={personalityGroups}
          toggleGroup={toggleGroup}
        />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No evaluation has been completed yet.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

