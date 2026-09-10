"use client";

import React from 'react';
import {
  EvaluationComments,
  EvaluationEmptyState,
  EvaluationLoadingState,
  EvaluationSkillsBreakdown,
  EvaluationSummaryScores,
} from './ApplicantEvaluationSectionParts';
import { useApplicantEvaluationSection } from './use-applicant-evaluation-section';

interface ApplicantEvaluationSectionProps {
  applicantId: string;
}

const ApplicantEvaluationSection: React.FC<ApplicantEvaluationSectionProps> = ({ applicantId }) => {
  const {
    evaluation,
    allEvaluations,
    loading,
    expandedGroups,
    toggleGroup,
    expertiseGroups,
    personalityGroups,
    expertiseAvg,
    personalityAvg,
  } = useApplicantEvaluationSection(applicantId);

  if (loading) {
    return <EvaluationLoadingState />;
  }

  if (!evaluation || evaluation.status !== 'completed') {
    return (
      <EvaluationEmptyState
        title="No evaluation data available"
        message={!evaluation
          ? 'Evaluation results will appear here once the evaluation is completed'
          : 'Evaluation is in progress. Results will appear here once completed'}
      />
    );
  }

  if (!evaluation.expertiseScores && !evaluation.personalityScores) {
    return (
      <EvaluationEmptyState
        title="No evaluation scores available"
        message="The evaluation has no scores to display"
      />
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      <EvaluationSummaryScores expertiseAvg={expertiseAvg} personalityAvg={personalityAvg} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <EvaluationSkillsBreakdown
          expertiseGroups={expertiseGroups}
          personalityGroups={personalityGroups}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />
        <EvaluationComments evaluations={allEvaluations} />
      </div>
    </div>
  );
};

export default ApplicantEvaluationSection;

