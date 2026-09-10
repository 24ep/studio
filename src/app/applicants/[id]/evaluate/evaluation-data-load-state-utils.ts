import type { EvaluationApplicantLike, EvaluationFormData, EvaluationSummary } from './types';
import { buildExpertiseTestingResults } from './evaluation-expertise-utils';
import { buildExistingEvaluationLoadState } from './evaluation-existing-state-utils';
import type {
  BuildEvaluationDataLoadStateInput,
  EvaluationDataLoadState,
} from './evaluation-form-state-types';
import {
  buildPersonalityEvaluationQuestions,
  calculateOverallEvaluationScore,
} from './evaluation-personality-question-utils';

function getNoEvaluationTraitsErrorMessage(applicant: EvaluationApplicantLike) {
  const positionName = applicant?.position?.title || 'this position';
  return `No evaluation traits configured for ${positionName}. Please configure personality traits in the position settings before evaluating applicants.`;
}

function applyExistingEvaluationState({
  existingEvaluationData,
  selectedInterviewerId,
  testingResults,
}: Pick<BuildEvaluationDataLoadStateInput, 'existingEvaluationData' | 'selectedInterviewerId'> & {
  testingResults: ReturnType<typeof buildExpertiseTestingResults>;
}) {
  let existingEvaluation: EvaluationSummary | null = null;
  let evaluationsMap: Map<string, EvaluationSummary> | null = null;
  let nextTestingResults = testingResults;

  if (Array.isArray(existingEvaluationData)) {
    const existingEvaluationState = buildExistingEvaluationLoadState({
      testingResults,
      evaluations: existingEvaluationData,
      selectedInterviewerId,
      scoreSource: 'all-evaluations',
    });
    evaluationsMap = existingEvaluationState.evaluationsMap;
    existingEvaluation = existingEvaluationState.existingEvaluation;
    nextTestingResults = existingEvaluationState.testingResults;
  } else if (existingEvaluationData) {
    const existingEvaluationState = buildExistingEvaluationLoadState({
      testingResults,
      evaluations: [existingEvaluationData],
      selectedInterviewerId,
      scoreSource: 'selected-evaluation',
    });
    existingEvaluation = existingEvaluationState.existingEvaluation;
    nextTestingResults = existingEvaluationState.testingResults;
  }

  return {
    existingEvaluation,
    evaluationsMap,
    testingResults: nextTestingResults,
  };
}

export function buildEvaluationDataLoadState({
  applicant,
  applicantPositionId,
  positionTitle = null,
  evaluationCriteria,
  existingEvaluationData = null,
  selectedInterviewerId = null,
  idSuffix,
}: BuildEvaluationDataLoadStateInput): EvaluationDataLoadState {
  const existingState = applyExistingEvaluationState({
    existingEvaluationData,
    selectedInterviewerId,
    testingResults: buildExpertiseTestingResults(evaluationCriteria),
  });

  const questions = buildPersonalityEvaluationQuestions(
    evaluationCriteria,
    existingState.existingEvaluation,
    idSuffix
  );
  if (questions.length === 0) {
    throw new Error(getNoEvaluationTraitsErrorMessage(applicant));
  }

  return {
    applicantRecruiterId: applicant?.recruiterId || null,
    positionId: applicantPositionId,
    positionTitle,
    testingResults: existingState.testingResults,
    existingEvaluation: existingState.existingEvaluation,
    evaluationsMap: existingState.evaluationsMap,
    formData: {
      applicant: applicant as unknown as EvaluationFormData['applicant'],
      position: applicant?.position
        ? applicant.position as unknown as EvaluationFormData['position']
        : undefined,
      questions,
      currentQuestionIndex: 0,
      overallScore: calculateOverallEvaluationScore(questions, existingState.existingEvaluation),
      comments: existingState.existingEvaluation?.comments || '',
    },
  };
}
