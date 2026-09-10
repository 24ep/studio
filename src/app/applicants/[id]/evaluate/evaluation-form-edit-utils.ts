import type { EvaluationFormData, EvaluationQuestion, EvaluationSummary } from './types';
import { applyPersonalityScoresToQuestions } from './evaluation-personality-score-map-utils';

export interface EvaluationActiveQuestionViewState {
  isCommentsView: boolean;
  currentQuestion: EvaluationQuestion | null;
  progressLabel: string;
  totalCount: number;
}

export function applySelectedInterviewerEvaluationToFormData(
  formData: EvaluationFormData | null,
  evaluation?: Pick<EvaluationSummary, 'personalityScores' | 'overallScore' | 'comments'> | null
) {
  if (!formData) return null;

  if (!evaluation) {
    return {
      ...formData,
      questions: formData.questions.map(question => ({ ...question, score: 0, notes: '' })),
      overallScore: 0,
      comments: '',
    };
  }

  if (!Array.isArray(evaluation.personalityScores)) {
    return formData;
  }

  return {
    ...formData,
    questions: applyPersonalityScoresToQuestions(
      formData.questions,
      evaluation.personalityScores,
      { missingScore: { score: 0, notes: '' } }
    ),
    overallScore: evaluation.overallScore ?? 0,
    comments: evaluation.comments || '',
  };
}

export function updateEvaluationQuestionScore(
  formData: EvaluationFormData | null,
  questionId: string,
  score: number
) {
  if (!formData) return null;

  const questions = formData.questions.map(question =>
    question.id === questionId ? { ...question, score } : question
  );
  const overallScore = questions.length > 0
    ? questions.reduce((sum, question) => sum + question.score, 0) / questions.length
    : 0;
  const currentQuestionIndex = formData.currentQuestionIndex;

  return {
    formData: {
      ...formData,
      questions,
      overallScore,
    },
    questions,
    overallScore,
    currentQuestionIndex,
    shouldAutoAdvance: currentQuestionIndex !== questions.length,
  };
}

export function updateEvaluationQuestionNotes(
  formData: EvaluationFormData | null,
  questionId: string,
  notes: string
) {
  if (!formData) return null;

  const questions = formData.questions.map(question =>
    question.id === questionId ? { ...question, notes } : question
  );

  return {
    formData: {
      ...formData,
      questions,
    },
    questions,
    overallScore: formData.overallScore,
  };
}

export function updateEvaluationComments(
  formData: EvaluationFormData | null,
  comments: string
) {
  if (!formData) return null;

  return {
    ...formData,
    comments,
  };
}

export function moveEvaluationQuestion(
  formData: EvaluationFormData | null,
  direction: 'previous' | 'next'
) {
  if (!formData) return null;

  const nextIndex = direction === 'previous'
    ? formData.currentQuestionIndex - 1
    : formData.currentQuestionIndex + 1;

  if (nextIndex < 0 || nextIndex > formData.questions.length) {
    return formData;
  }

  return {
    ...formData,
    currentQuestionIndex: nextIndex,
  };
}

export function getEvaluationTraitNavigationUpdate(
  formData: EvaluationFormData | null,
  traitId?: string | null
) {
  if (!formData || !traitId) {
    return null;
  }

  const questionIndex = formData.questions.findIndex(question => question.traitId === traitId);
  if (questionIndex === -1) {
    return null;
  }

  return {
    formData: {
      ...formData,
      currentQuestionIndex: questionIndex,
    },
    questionIndex,
  };
}

export function buildEvaluationActiveQuestionViewState(
  formData: Pick<EvaluationFormData, 'questions' | 'currentQuestionIndex'>
): EvaluationActiveQuestionViewState {
  const totalCount = formData.questions.length;
  const isCommentsView = formData.currentQuestionIndex === totalCount;
  const currentQuestion = isCommentsView
    ? formData.questions[0] || null
    : formData.questions[formData.currentQuestionIndex] || formData.questions[0] || null;

  return {
    isCommentsView,
    currentQuestion,
    progressLabel: isCommentsView
      ? 'Comments'
      : `Question ${formData.currentQuestionIndex + 1}/${totalCount}`,
    totalCount,
  };
}
