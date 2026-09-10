import type {
  ApplicantEvaluationAttachment,
  ApplicantEvaluationData,
  ApplicantEvaluationLinkInfo,
  ApplicantPersonalityScore,
  ApplicantEvaluationTrait,
} from './applicant-evaluation-modal-types';

type UnknownRecord = Record<string, unknown>;
type NullableEvaluationData = ApplicantEvaluationData | null;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function normalizeEvaluationData(value: unknown): ApplicantEvaluationData | null {
  if (!isRecord(value)) return null;

  return {
    expertiseScores: Array.isArray(value.expertiseScores) ? value.expertiseScores : [],
    personalityScores: normalizePersonalityScores(value.personalityScores),
    overallScore: typeof value.overallScore === 'number' ? value.overallScore : 0,
    status: typeof value.status === 'string' ? value.status : '',
    comments: typeof value.comments === 'string' ? value.comments : '',
    evaluator: normalizeEvaluator(value.evaluator),
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : '',
  };
}

export function normalizeEvaluationList(value: unknown): ApplicantEvaluationData[] {
  return Array.isArray(value)
    ? value.map(normalizeEvaluationData).filter(isNonNullEvaluationData)
    : [];
}

export function normalizeAttachments(value: unknown): ApplicantEvaluationAttachment[] {
  return getListPayload(value).filter(isRecord);
}

export function normalizeCreatedBy(value: unknown): ApplicantEvaluationLinkInfo['createdBy'] {
  if (!isRecord(value)) return undefined;

  const id = getString(value.id);
  const name = getString(value.name);
  const email = getString(value.email);
  return id && name && email ? { id, name, email } : undefined;
}

export function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isNonNullEvaluationData(value: NullableEvaluationData): value is ApplicantEvaluationData {
  return value !== null;
}

function getListPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.data)) return value.data;
  return [];
}

function normalizeEvaluator(value: unknown): ApplicantEvaluationData['evaluator'] {
  if (!isRecord(value)) {
    return { name: '', email: '' };
  }

  return {
    name: getString(value.name) ?? '',
    email: getString(value.email) ?? '',
  };
}

function normalizePersonalityScores(value: unknown): ApplicantPersonalityScore[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isPersonalityScoreRecord)
    .map((score) => ({
      trait: normalizeTrait(score.trait),
      score: score.score,
    }));
}

function isPersonalityScoreRecord(value: unknown): value is { trait: UnknownRecord & { id: string }; score: number } {
  return isRecord(value) &&
    isRecord(value.trait) &&
    typeof value.trait.id === 'string' &&
    typeof value.score === 'number';
}

function normalizeTrait(trait: UnknownRecord & { id: string }): ApplicantEvaluationTrait {
  return {
    id: trait.id,
    name: getString(trait.name) ?? undefined,
    description: getString(trait.description) ?? undefined,
    group: normalizeTraitGroup(trait.group),
  };
}

function normalizeTraitGroup(value: unknown): ApplicantEvaluationTrait['group'] {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string'
    ? {
      id: value.id,
      name: value.name,
      color: value.color,
    }
    : null;
}
