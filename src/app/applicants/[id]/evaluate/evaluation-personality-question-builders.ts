import type { EvaluationQuestion } from './types';
import type {
  EvaluationCriteriaLike,
  EvaluationTraitLike,
  PersonalityGroupLike,
} from './evaluation-form-state-types';

export function compareOrderAndName(
  first: { sortOrder?: number | null; name?: string | null },
  second: { sortOrder?: number | null; name?: string | null }
) {
  const orderDifference = (first.sortOrder || 0) - (second.sortOrder || 0);
  if (orderDifference !== 0) {
    return orderDifference;
  }

  return (first.name || '').localeCompare(second.name || '');
}

export function sortPersonalityGroupsByDisplayOrder<T extends PersonalityGroupLike>(groups?: T[] | null) {
  return [...(Array.isArray(groups) ? groups : [])].sort(compareOrderAndName);
}

function hasQuestionTraitFields(
  trait: EvaluationTraitLike | null | undefined
): trait is EvaluationTraitLike & { id: string; name: string } {
  return typeof trait?.id === 'string' && typeof trait.name === 'string';
}

function sortTraitsByOrderAndName(traits?: EvaluationTraitLike[] | null) {
  return [...(traits || [])].sort(compareOrderAndName);
}

function buildQuestionFromTrait(
  trait: EvaluationTraitLike & { id: string; name: string },
  groupName: string,
  idSuffix: string | number
): EvaluationQuestion {
  return {
    id: `${trait.id}-${idSuffix}`,
    traitId: trait.id,
    traitName: trait.name,
    groupName,
    description: trait.description || '',
    shortDescription: trait.shortDescription || trait.short_description || '',
    score: 0,
    notes: '',
  };
}

function appendQuestionForTrait({
  addedTraitIds,
  groupName,
  idSuffix,
  questions,
  trait,
}: {
  addedTraitIds: Set<string>;
  groupName: string;
  idSuffix: string | number;
  questions: EvaluationQuestion[];
  trait: EvaluationTraitLike | null | undefined;
}) {
  if (!hasQuestionTraitFields(trait) || trait.isActive === false || addedTraitIds.has(trait.id)) {
    return;
  }

  addedTraitIds.add(trait.id);
  questions.push(buildQuestionFromTrait(trait, groupName, idSuffix));
}

function appendPersonalityGroupQuestions({
  addedTraitIds,
  evaluationCriteria,
  idSuffix,
  questions,
}: {
  addedTraitIds: Set<string>;
  evaluationCriteria: EvaluationCriteriaLike;
  idSuffix: string | number;
  questions: EvaluationQuestion[];
}) {
  for (const groupAssignment of evaluationCriteria?.personalityGroups || []) {
    const groupName = groupAssignment?.group?.name || 'Unknown Group';
    const traits = sortTraitsByOrderAndName(groupAssignment?.group?.traits);

    for (const trait of traits) {
      appendQuestionForTrait({ addedTraitIds, groupName, idSuffix, questions, trait });
    }
  }
}

function appendIndividualTraitQuestions({
  addedTraitIds,
  evaluationCriteria,
  idSuffix,
  questions,
}: {
  addedTraitIds: Set<string>;
  evaluationCriteria: EvaluationCriteriaLike;
  idSuffix: string | number;
  questions: EvaluationQuestion[];
}) {
  const individualAssignments = [...(evaluationCriteria?.personalityTraits || [])]
    .sort((first, second) => compareOrderAndName(first?.trait || {}, second?.trait || {}));

  for (const assignment of individualAssignments) {
    const trait = assignment?.trait;
    appendQuestionForTrait({
      addedTraitIds,
      groupName: trait?.group?.name || 'Individual Traits',
      idSuffix,
      questions,
      trait,
    });
  }
}

export function buildBasePersonalityEvaluationQuestions(
  evaluationCriteria: EvaluationCriteriaLike,
  idSuffix: string | number
) {
  const questions: EvaluationQuestion[] = [];
  const addedTraitIds = new Set<string>();

  appendPersonalityGroupQuestions({ addedTraitIds, evaluationCriteria, idSuffix, questions });
  appendIndividualTraitQuestions({ addedTraitIds, evaluationCriteria, idSuffix, questions });

  return questions.filter(question => question.traitId && question.traitName);
}
