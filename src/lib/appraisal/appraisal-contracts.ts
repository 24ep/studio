import { z } from 'zod';

export const APPRAISAL_CYCLE_STATUSES = [
  'draft',
  'preparing',
  'scheduled',
  'self_assessment',
  'manager_review',
  'peer_review',
  'calibration',
  'final_approval',
  'ready_for_release',
  'released',
  'closed',
  'cancelled',
  'archived',
] as const;

export const APPRAISAL_REVIEW_STATUSES = [
  'not_started',
  'self_assessment_in_progress',
  'awaiting_employee_submission',
  'awaiting_manager_review',
  'manager_review_in_progress',
  'awaiting_peer_review',
  'awaiting_second_level_approval',
  'awaiting_hr_review',
  'awaiting_calibration',
  'calibration_in_progress',
  'awaiting_final_approval',
  'ready_for_release',
  'released',
  'acknowledgment_pending',
  'acknowledged',
  'returned_for_revision',
  'disputed',
  'completed',
  'cancelled',
  'closed',
] as const;

export const REVIEWER_ROLES = [
  'self',
  'manager',
  'second_level_manager',
  'peer',
  'direct_report',
  'project_manager',
  'matrix_manager',
  'hr',
  'calibration',
] as const;

export type AppraisalCycleStatus = typeof APPRAISAL_CYCLE_STATUSES[number];
export type AppraisalReviewStatus = typeof APPRAISAL_REVIEW_STATUSES[number];
export type AppraisalRole = 'employee' | 'manager' | 'reviewer' | 'hr' | 'administrator';

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const ratingValue = z.coerce.number().min(0).max(100);
const expectedVersion = z.coerce.number().int().positive();
const idempotencyKey = z.string().trim().min(8).max(120);

const evaluationSchema = z.object({
  itemId: z.string().trim().min(1).max(160),
  rating: z.coerce.number().min(0).max(100),
  comment: optionalText(4000),
  evidence: z.array(z.string().url().max(2000)).max(10).default([]),
});

export const appraisalMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_cycle'),
    name: z.string().trim().min(3).max(160),
    description: optionalText(4000),
    reviewType: z.enum(['annual', 'mid_year', 'quarterly', 'probation', 'project', 'promotion', 'performance_improvement', 'ad_hoc']),
    startDate: z.string().date(),
    endDate: z.string().date(),
    selfDueDate: z.string().date(),
    managerDueDate: z.string().date(),
    releaseDate: z.string().date().optional().nullable(),
    templateVersionId: uuid,
    ratingModelId: uuid,
    population: z.object({
      companyId: uuid.optional().nullable(),
      departmentIds: z.array(uuid).max(100).default([]),
      employeeIds: z.array(uuid).max(1000).default([]),
      excludedEmployeeIds: z.array(uuid).max(1000).default([]),
      employmentStatuses: z.array(z.string().trim().max(80)).max(20).default(['active']),
    }),
    requirePeerReview: z.boolean().default(false),
    requireCalibration: z.boolean().default(true),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('preview_population'),
    companyId: uuid.optional().nullable(),
    departmentIds: z.array(uuid).max(100).default([]),
    employeeIds: z.array(uuid).max(1000).default([]),
    excludedEmployeeIds: z.array(uuid).max(1000).default([]),
    employmentStatuses: z.array(z.string().trim().max(80)).max(20).default(['active']),
  }),
  z.object({
    action: z.literal('send_reminders'),
    reviewIds: z.array(uuid).min(1).max(500),
  }),
  z.object({
    action: z.literal('generate_population'),
    cycleId: uuid,
    expectedVersion,
    idempotencyKey,
  }),
  z.object({
    action: z.literal('change_cycle_stage'),
    cycleId: uuid,
    status: z.enum(APPRAISAL_CYCLE_STATUSES),
    reason: z.string().trim().min(3).max(2000),
    expectedVersion,
  }),
  z.object({
    action: z.literal('save_self_assessment'),
    reviewId: uuid,
    responses: z.record(z.string().max(160), z.union([z.string().max(12000), z.number(), z.boolean(), z.array(z.string().max(2000))])),
    goalEvaluations: z.array(evaluationSchema).max(100).default([]),
    competencyEvaluations: z.array(evaluationSchema).max(100).default([]),
    summary: optionalText(12000),
    strengths: optionalText(8000),
    developmentAreas: optionalText(8000),
    careerAspiration: optionalText(8000),
    expectedVersion,
  }),
  z.object({
    action: z.literal('submit_self_assessment'),
    reviewId: uuid,
    expectedVersion,
  }),
  z.object({
    action: z.literal('save_manager_assessment'),
    reviewId: uuid,
    rating: ratingValue,
    comments: z.string().trim().min(20).max(12000),
    strengths: optionalText(8000),
    developmentAreas: optionalText(8000),
    developmentRecommendation: optionalText(8000),
    goalEvaluations: z.array(evaluationSchema).max(100).default([]),
    competencyEvaluations: z.array(evaluationSchema).max(100).default([]),
    expectedVersion,
  }),
  z.object({
    action: z.literal('submit_manager_assessment'),
    reviewId: uuid,
    expectedVersion,
  }),
  z.object({
    action: z.literal('assign_reviewer'),
    reviewId: uuid,
    reviewerId: uuid,
    reviewerRole: z.enum(REVIEWER_ROLES),
    dueDate: z.string().date(),
    weight: z.coerce.number().min(0).max(100).default(0),
    isAnonymous: z.boolean().default(false),
    isRequired: z.boolean().default(true),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('submit_peer_review'),
    assignmentId: uuid,
    rating: ratingValue,
    strengths: z.string().trim().min(10).max(6000),
    developmentAreas: z.string().trim().min(10).max(6000),
    comments: optionalText(8000),
    responses: z.record(z.string().max(160), z.union([z.string().max(8000), z.number(), z.boolean()])),
    expectedVersion,
  }),
  z.object({
    action: z.literal('calculate_rating'),
    reviewId: uuid,
    expectedVersion,
  }),
  z.object({
    action: z.literal('override_rating'),
    reviewId: uuid,
    newRating: ratingValue,
    reason: z.string().trim().min(10).max(4000),
    comment: z.string().trim().min(10).max(4000),
    expectedVersion,
  }),
  z.object({
    action: z.literal('calibrate_rating'),
    reviewId: uuid,
    calibratedRating: ratingValue,
    decision: z.enum(['adjusted', 'confirmed', 'returned', 'additional_information']),
    notes: z.string().trim().min(10).max(6000),
    expectedVersion,
  }),
  z.object({
    action: z.literal('approval_decision'),
    reviewId: uuid,
    decision: z.enum(['approved', 'returned', 'rejected']),
    comment: z.string().trim().min(3).max(4000),
    expectedVersion,
  }),
  z.object({
    action: z.literal('release_result'),
    reviewId: uuid,
    expectedVersion,
    idempotencyKey,
  }),
  z.object({
    action: z.literal('acknowledge_result'),
    reviewId: uuid,
    comment: optionalText(4000),
    requestDiscussion: z.boolean().default(false),
    expectedVersion,
  }),
  z.object({
    action: z.literal('submit_appeal'),
    reviewId: uuid,
    reason: z.string().trim().min(20).max(8000),
    evidence: z.array(z.string().url().max(2000)).max(10).default([]),
    expectedVersion,
  }),
  z.object({
    action: z.literal('create_template'),
    name: z.string().trim().min(3).max(160),
    description: optionalText(2000),
    sections: z.array(z.object({
      key: z.string().trim().min(1).max(80),
      title: z.string().trim().min(2).max(160),
      type: z.enum(['information', 'text', 'rating', 'goal', 'competency', 'acknowledgment']),
      instructions: optionalText(2000),
      required: z.boolean().default(false),
      weight: z.coerce.number().min(0).max(100).default(0),
      visibleTo: z.array(z.enum(REVIEWER_ROLES)).min(1),
      editableBy: z.array(z.enum(REVIEWER_ROLES)).min(1),
    })).min(1).max(40),
    idempotencyKey,
  }),
]);

export type AppraisalMutation = z.infer<typeof appraisalMutationSchema>;

export interface RatingLevel {
  id?: string;
  code: string;
  label: string;
  description?: string | null;
  numericValue: number;
  minScore: number;
  maxScore: number;
  semanticStatus?: string | null;
  guidance?: string | null;
}

export interface WeightedRatingInput {
  score: number | null | undefined;
  weight: number;
  required?: boolean;
}

export function calculateWeightedRating(
  inputs: WeightedRatingInput[],
  options: { missingBehavior?: 'exclude' | 'zero' | 'block'; decimals?: number } = {},
) {
  const missingBehavior = options.missingBehavior ?? 'block';
  const decimals = options.decimals ?? 2;
  const requiredMissing = inputs.some(input => input.required && input.score == null);
  if (requiredMissing && missingBehavior === 'block') {
    return { score: null, complete: false, reason: 'A required rating is missing.' };
  }

  const normalized = inputs
    .map(input => ({
      score: input.score == null ? (missingBehavior === 'zero' ? 0 : null) : Number(input.score),
      weight: Math.max(0, Number(input.weight) || 0),
    }))
    .filter(input => input.score != null && input.weight > 0) as Array<{ score: number; weight: number }>;
  const totalWeight = normalized.reduce((sum, input) => sum + input.weight, 0);
  if (!totalWeight) return { score: null, complete: false, reason: 'No weighted ratings are available.' };

  const raw = normalized.reduce((sum, input) => sum + input.score * input.weight, 0) / totalWeight;
  const factor = 10 ** decimals;
  return { score: Math.round(raw * factor) / factor, complete: !requiredMissing, reason: null };
}

export function ratingLevelForScore(levels: RatingLevel[], score: number | null | undefined) {
  if (score == null) return null;
  return [...levels]
    .sort((a, b) => b.minScore - a.minScore)
    .find(level => score >= level.minScore && score <= level.maxScore) ?? null;
}

export function canRevealFinalRating(status: unknown, releasedAt: unknown) {
  const normalized = String(status || '').toLowerCase();
  return Boolean(releasedAt) || ['released', 'acknowledgment_pending', 'acknowledged', 'disputed', 'completed', 'closed'].includes(normalized);
}

export function appraisalStatusLabel(value: unknown) {
  return String(value || 'not_started')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export interface AppraisalWorkspaceData {
  permissions: {
    role: AppraisalRole;
    canManage: boolean;
    canCalibrate: boolean;
    canApprove: boolean;
    canViewReports: boolean;
    canOverrideRating: boolean;
  };
  actorEmployeeId: string | null;
  cycles: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  teamReviews: Array<Record<string, unknown>>;
  reviewerAssignments: Array<Record<string, unknown>>;
  templates: Array<Record<string, unknown>>;
  ratingModels: Array<Record<string, unknown>>;
  calibration: Array<Record<string, unknown>>;
  approvals: Array<Record<string, unknown>>;
  appeals: Array<Record<string, unknown>>;
  timeline: Array<Record<string, unknown>>;
  populationPreview: Array<Record<string, unknown>>;
  analytics: {
    total: number;
    selfCompleted: number;
    managerCompleted: number;
    released: number;
    overdue: number;
    completionRate: number;
    ratingDistribution: Array<{ label: string; count: number }>;
    departmentProgress: Array<{ department: string; total: number; completed: number }>;
  };
  meta: {
    generatedAt: string;
    partial: boolean;
    unavailableSources: string[];
  };
}
