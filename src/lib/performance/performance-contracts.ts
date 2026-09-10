import { z } from 'zod';

export const PERFORMANCE_CHECK_IN_STATUSES = [
  'planned',
  'in_preparation',
  'scheduled',
  'completed',
  'cancelled',
  'overdue',
] as const;

export const PERFORMANCE_STATUSES = [
  'on_track',
  'attention_required',
  'at_risk',
  'review_not_started',
  'review_in_progress',
  'awaiting_employee',
  'awaiting_manager',
  'awaiting_calibration',
  'awaiting_acknowledgment',
  'completed',
] as const;

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const idempotencyKey = z.string().trim().min(8).max(120);

export const performanceMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_check_in'),
    employeeId: uuid,
    type: z.enum([
      'one_on_one',
      'probation',
      'monthly',
      'quarterly',
      'performance_improvement',
      'development',
      'career_conversation',
    ]),
    meetingDate: z.string().datetime({ offset: true }).or(z.string().datetime()),
    agenda: z.string().trim().min(3).max(4000),
    sharedNotes: optionalText(8000),
    employeeDraftNotes: optionalText(8000),
    managerPrivateNotes: optionalText(8000),
    recurringRule: optionalText(120),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('complete_check_in'),
    id: uuid,
    employeeId: uuid,
    sharedNotes: optionalText(8000),
    achievements: optionalText(6000),
    challenges: optionalText(6000),
    supportRequired: optionalText(4000),
    followUpItems: z.array(z.object({
      title: z.string().trim().min(2).max(240),
      dueDate: z.string().date().optional().nullable(),
      owner: z.enum(['employee', 'manager', 'shared']).default('shared'),
    })).max(20).default([]),
    expectedVersion: z.coerce.number().int().positive(),
  }),
  z.object({
    action: z.literal('give_feedback'),
    recipientId: uuid,
    feedbackType: z.enum(['manager', 'peer', 'project', 'coaching', 'improvement']),
    relationship: optionalText(100),
    visibility: z.enum(['recipient', 'manager', 'hr', 'authorized_reviewer']).default('recipient'),
    relatedProject: optionalText(240),
    relatedGoalId: uuid.optional().nullable(),
    relatedCompetency: optionalText(240),
    context: z.string().trim().min(3).max(4000),
    wentWell: optionalText(4000),
    improvementSuggestion: optionalText(4000),
    recommendedAction: optionalText(4000),
    isAnonymous: z.boolean().default(false),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('request_feedback'),
    requestedProviderId: uuid,
    context: z.string().trim().min(3).max(2000),
    relatedProject: optionalText(240),
    relatedCompetency: optionalText(240),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('recognize'),
    recipientId: uuid,
    category: z.enum([
      'great_teamwork',
      'customer_impact',
      'innovation',
      'leadership',
      'ownership',
      'excellent_delivery',
      'learning_achievement',
    ]),
    message: z.string().trim().min(8).max(3000),
    companyValue: optionalText(160),
    competency: optionalText(240),
    relatedProject: optionalText(240),
    visibility: z.enum(['recipient', 'manager', 'company']).default('recipient'),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('submit_competency_evidence'),
    employeeId: uuid,
    competencyName: z.string().trim().min(2).max(240),
    evidenceType: z.enum(['project_achievement', 'certification', 'work_sample', 'feedback', 'training', 'manager_validation']),
    title: z.string().trim().min(3).max(240),
    description: optionalText(4000),
    evidenceUrl: z.string().url().max(2000).optional().nullable(),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('create_development_plan'),
    employeeId: uuid,
    title: z.string().trim().min(3).max(240),
    planType: z.enum(['performance_improvement', 'skill_development', 'career_development', 'mandatory']),
    aspiration: optionalText(3000),
    targetDate: z.string().date().optional().nullable(),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('add_development_action'),
    planId: uuid,
    employeeId: uuid,
    title: z.string().trim().min(3).max(240),
    description: optionalText(4000),
    actionType: z.enum(['learning_course', 'coaching', 'mentoring', 'stretch_assignment', 'project_assignment', 'on_the_job', 'certification']),
    relatedCompetency: optionalText(240),
    learningCourseId: uuid.optional().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    dueDate: z.string().date().optional().nullable(),
    idempotencyKey,
  }),
  z.object({
    action: z.literal('update_development_action'),
    id: uuid,
    employeeId: uuid,
    progress: z.coerce.number().int().min(0).max(100),
    status: z.enum(['proposed', 'approved', 'in_progress', 'at_risk', 'completed', 'cancelled']),
    employeeComments: optionalText(3000),
    managerComments: optionalText(3000),
    expectedVersion: z.coerce.number().int().positive(),
  }),
]);

export type PerformanceMutation = z.infer<typeof performanceMutationSchema>;

export interface PerformanceEmployeeSummary {
  id: string;
  name: string;
  employeeNumber: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  managerId: string | null;
  managerName: string | null;
  profilePhotoUrl: string | null;
}

export interface PerformancePermissions {
  role: 'employee' | 'manager' | 'hr' | 'administrator';
  canViewTeam: boolean;
  canViewOrganization: boolean;
  canManagePerformance: boolean;
  canViewRatings: boolean;
  canViewPrivateManagerNotes: boolean;
}

export function derivePerformancePermissions(input: {
  isAdministrator: boolean;
  hasHrView: boolean;
  isManager: boolean;
  canManagePerformance: boolean;
}): PerformancePermissions {
  const role: PerformancePermissions['role'] = input.isAdministrator
    ? 'administrator'
    : input.hasHrView
      ? 'hr'
      : input.isManager
        ? 'manager'
        : 'employee';
  return {
    role,
    canViewTeam: input.isManager || input.hasHrView,
    canViewOrganization: input.hasHrView,
    canManagePerformance: input.canManagePerformance,
    canViewRatings: true,
    canViewPrivateManagerNotes: input.isManager || input.hasHrView,
  };
}

export function canViewManagerPrivateNotes(input: {
  hasHrView: boolean;
  actorEmployeeId: string | null | undefined;
  targetManagerId: string | null | undefined;
}) {
  return input.hasHrView
    || Boolean(input.actorEmployeeId && input.actorEmployeeId === input.targetManagerId);
}

export interface PerformanceWorkspaceData {
  permissions: PerformancePermissions;
  selectedEmployee: PerformanceEmployeeSummary | null;
  employees: PerformanceEmployeeSummary[];
  cycles: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  checkIns: Array<Record<string, unknown>>;
  feedback: Array<Record<string, unknown>>;
  recognition: Array<Record<string, unknown>>;
  competencyEvidence: Array<Record<string, unknown>>;
  developmentPlans: Array<Record<string, unknown>>;
  developmentActions: Array<Record<string, unknown>>;
  activities: Array<Record<string, unknown>>;
  alerts: PerformanceAlert[];
  team: Array<Record<string, unknown>>;
  insights: {
    facts: Array<{ label: string; value: number | string; description: string }>;
    calculated: Array<{ label: string; value: number | string; description: string }>;
    recommendations: Array<{ label: string; reason: string; href: string }>;
  };
  meta: {
    generatedAt: string;
    partial: boolean;
    unavailableSources: string[];
  };
}

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  reason: string;
  requiredAction: string;
  owner: string;
  dueDate: string | null;
  relatedRecord: string;
  href: string;
  resolutionStatus: 'open';
}

export function toPerformanceStatus(input: {
  reviewStatus?: unknown;
  overdueActions?: number;
  atRiskGoals?: number;
}) {
  const reviewStatus = String(input.reviewStatus || '').toLowerCase();
  if (input.overdueActions && input.overdueActions > 0) return 'attention_required';
  if (input.atRiskGoals && input.atRiskGoals > 0) return 'at_risk';
  if (reviewStatus === 'completed' || reviewStatus === 'acknowledged') return 'completed';
  if (reviewStatus === 'not_started') return 'review_not_started';
  if (['submitted', 'manager_review'].includes(reviewStatus)) return 'awaiting_manager';
  if (['in_progress', 'returned_for_revision'].includes(reviewStatus)) return 'awaiting_employee';
  return 'on_track';
}

export function statusLabel(value: unknown) {
  return String(value || 'not_started')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function canReadFeedback(
  visibility: unknown,
  context: { isRecipient: boolean; isManager: boolean; isHr: boolean },
) {
  const normalized = String(visibility || 'recipient');
  if (context.isHr) return true;
  if (normalized === 'recipient') return context.isRecipient;
  if (normalized === 'manager') return context.isManager;
  return false;
}

export function shouldRevealRating(status: unknown, canViewRatings: boolean) {
  return canViewRatings && ['completed', 'acknowledged', 'released'].includes(String(status || '').toLowerCase());
}
