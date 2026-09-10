import { randomUUID } from 'crypto';

import type { Prisma, PrismaClient } from '@prisma/client';

import { NotificationService } from '@/lib/notificationService';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';
import {
  calculateWeightedRating,
  canRevealFinalRating,
  type AppraisalMutation,
  type AppraisalWorkspaceData,
} from './appraisal-contracts';

type SessionUser = {
  id: string;
  email?: string | null;
  role?: string;
  modulePermissions?: PlatformModuleId[];
};

type Db = PrismaClient | Prisma.TransactionClient;
type Row = Record<string, unknown>;

type EmployeeRow = {
  id: string;
  userId: string | null;
  employeeNumber: string;
  name: string;
  email: string;
  jobTitle: string | null;
  departmentId: string | null;
  department: string | null;
  managerId: string | null;
  managerName: string | null;
  companyId: string | null;
  status: string;
};

type AccessContext = {
  actor: EmployeeRow | null;
  isAdministrator: boolean;
  isHr: boolean;
  isManager: boolean;
  isReviewer: boolean;
  canManage: boolean;
};

const REVIEW_SELECT = `
  SELECT r.id, r.cycle_id AS "cycleId", r.employee_id AS "employeeId",
         r.reviewer_id AS "managerId", r.status, r.rating,
         r.summary, r.self_assessment AS "selfAssessment",
         r.self_responses AS "selfResponses",
         r.manager_assessment AS "managerAssessment",
         r.manager_comments AS "managerComments",
         r.competency_assessment AS "competencyAssessment",
         r.employee_comments AS "employeeComments",
         r.strengths, r.development_areas AS "developmentAreas",
         r.career_aspiration AS "careerAspiration",
         r.development_plan AS "developmentPlan",
         r.development_recommendation AS "developmentRecommendation",
         r.calculated_rating AS "calculatedRating",
         r.manager_rating AS "managerRating",
         r.calibrated_rating AS "calibratedRating",
         r.final_rating AS "finalRating",
         r.goal_result AS "goalResult",
         r.competency_result AS "competencyResult",
         r.submitted_at AS "submittedAt",
         r.completed_at AS "completedAt",
         r.released_at AS "releasedAt",
         r.acknowledged_at AS "acknowledgedAt",
         r.acknowledgment_status AS "acknowledgmentStatus",
         r.acknowledgment_comment AS "acknowledgmentComment",
         r.discussion_requested_at AS "discussionRequestedAt",
         r.version, r.created_at AS "createdAt", r.updated_at AS "updatedAt",
         c.name AS "cycleName", c.review_type AS "reviewType",
         c.start_date AS "cycleStartDate", c.end_date AS "cycleEndDate",
         c.self_due_date AS "selfDueDate", c.manager_due_date AS "managerDueDate",
         c.status AS "cycleStatus", c.configuration AS "cycleConfiguration",
         e.employee_number AS "employeeNumber",
         CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS "employeeName",
         e.job_title AS "jobTitle", e.profile_photo_url AS "profilePhotoUrl",
         e.manager_id AS "employeeManagerId",
         COALESCE(d.name, e.business_unit) AS department,
         CONCAT_WS(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS "managerName",
         rm.name AS "ratingModelName", rm.configuration AS "ratingConfiguration",
         tv.sections AS "templateSections",
         COALESCE(goal_data.goals, '[]'::jsonb) AS goals
    FROM "hr_performance_reviews" r
    JOIN "hr_performance_cycles" c ON c.id = r.cycle_id
    JOIN "hr_employees" e ON e.id = r.employee_id
    LEFT JOIN "hr_departments" d ON d.id = e.department_id
    LEFT JOIN "hr_employees" m ON m.id = e.manager_id
    LEFT JOIN "hr_appraisal_rating_models" rm ON rm.id = r.rating_model_id
    LEFT JOIN "hr_appraisal_template_versions" tv ON tv.id = r.template_version_id
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', g.id, 'title', g.title, 'description', g.description,
          'status', g.status, 'progress', g.progress, 'dueDate', g.due_date,
          'keyResults', g.key_results, 'evidence', g.evidence,
          'approvalStatus', g.approval_status
        ) ORDER BY g.created_at
      ) AS goals
      FROM "hr_performance_goals" g
      WHERE g.employee_id = r.employee_id AND (g.review_id = r.id OR g.review_id IS NULL)
    ) goal_data ON TRUE
`;

function can(user: SessionUser, permission: PlatformModuleId) {
  return hasAnyPermission(user, [permission]);
}

async function findActor(user: SessionUser) {
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT e.id, e.user_id AS "userId", e.employee_number AS "employeeNumber",
            CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
            e.email, e.job_title AS "jobTitle", e.department_id AS "departmentId",
            COALESCE(d.name, e.business_unit) AS department, e.manager_id AS "managerId",
            CONCAT_WS(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS "managerName",
            e.company_id AS "companyId", e.status
       FROM "hr_employees" e
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       LEFT JOIN "hr_employees" m ON m.id = e.manager_id
      WHERE e.user_id = $1::uuid OR lower(e.email) = lower($2)
      ORDER BY CASE WHEN e.user_id = $1::uuid THEN 0 ELSE 1 END
      LIMIT 1`,
    user.id,
    user.email || '',
  );
  return rows[0] || null;
}

async function buildAccess(user: SessionUser): Promise<AccessContext> {
  const actor = await findActor(user);
  const isAdministrator = user.role === 'Admin';
  const canManage = isAdministrator || can(user, 'HR_PERFORMANCE_MANAGE');
  const isHr = canManage || can(user, 'HR_PERFORMANCE_VIEW');
  const managerRows = actor
    ? await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "hr_employees"
        WHERE manager_id = $1::uuid AND status IN ('active', 'probation', 'onboarding')`,
      actor.id,
    )
    : [{ count: 0 }];
  const reviewerRows = actor
    ? await optionalRows('reviewer access', () => prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "hr_appraisal_reviewers"
        WHERE reviewer_id = $1::uuid AND status NOT IN ('submitted', 'declined')`,
      actor.id,
    ))
    : [];
  return {
    actor,
    isAdministrator,
    isHr,
    canManage,
    isManager: Number(managerRows[0]?.count || 0) > 0,
    isReviewer: Number(reviewerRows[0]?.count || 0) > 0,
  };
}

async function optionalRows<T>(source: string, query: () => Promise<T[]>, unavailable?: string[]) {
  try {
    return await query();
  } catch (error) {
    console.warn(`[Appraisal] ${source} unavailable:`, error);
    unavailable?.push(source);
    return [];
  }
}

function roleFor(access: AccessContext): AppraisalWorkspaceData['permissions']['role'] {
  if (access.isAdministrator) return 'administrator';
  if (access.isHr) return 'hr';
  if (access.isManager) return 'manager';
  if (access.isReviewer) return 'reviewer';
  return 'employee';
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function sanitizeReview(row: Row, access: AccessContext, perspective: 'self' | 'team') {
  const output = { ...row };
  const released = canRevealFinalRating(row.status, row.releasedAt);
  if (!access.isHr && !released && perspective === 'self') {
    delete output.rating;
    delete output.finalRating;
    delete output.calibratedRating;
    delete output.calculatedRating;
    delete output.managerRating;
    delete output.managerAssessment;
    delete output.managerComments;
  }
  if (!access.isHr && !released && perspective === 'team') {
    delete output.finalRating;
  }
  return output;
}

function analyticsFor(rows: Row[], ratingLevels: Row[]) {
  const total = rows.length;
  const selfCompleted = rows.filter(row => row.submittedAt).length;
  const managerCompleted = rows.filter(row =>
    ['awaiting_calibration', 'awaiting_final_approval', 'ready_for_release', 'released', 'acknowledged', 'completed']
      .includes(String(row.status)),
  ).length;
  const released = rows.filter(row => row.releasedAt).length;
  const overdue = rows.filter(row => {
    const due = row.managerDueDate || row.selfDueDate;
    return due && new Date(String(due)).getTime() < Date.now() && !row.releasedAt;
  }).length;
  const ratingDistribution = ratingLevels.map(level => ({
    label: String(level.label),
    count: rows.filter(row => {
      const score = Number(row.finalRating ?? row.calibratedRating ?? row.managerRating ?? NaN);
      return Number.isFinite(score)
        && score >= Number(level.minimumScore)
        && score <= Number(level.maximumScore);
    }).length,
  }));
  const departments = new Map<string, { total: number; completed: number }>();
  for (const row of rows) {
    const department = String(row.department || 'Unassigned');
    const current = departments.get(department) || { total: 0, completed: 0 };
    current.total += 1;
    if (row.releasedAt || row.completedAt) current.completed += 1;
    departments.set(department, current);
  }
  return {
    total,
    selfCompleted,
    managerCompleted,
    released,
    overdue,
    completionRate: total ? Math.round((released / total) * 100) : 0,
    ratingDistribution,
    departmentProgress: [...departments.entries()].map(([department, counts]) => ({ department, ...counts })),
  };
}

export async function getAppraisalWorkspace(user: SessionUser): Promise<AppraisalWorkspaceData> {
  const access = await buildAccess(user);
  const unavailableSources: string[] = [];
  const actorId = access.actor?.id || null;
  const companyId = access.actor?.companyId || null;

  const [
    cycles,
    ownReviews,
    teamReviews,
    assignments,
    templates,
    ratingModels,
    ratingLevels,
    calibration,
    approvals,
    appeals,
    timeline,
    populationPreview,
  ] = await Promise.all([
    optionalRows('cycles', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT c.*, c.start_date AS "startDate", c.end_date AS "endDate",
              c.self_due_date AS "selfDueDate", c.manager_due_date AS "managerDueDate",
              c.review_type AS "reviewType", c.population_config AS "populationConfig",
              c.template_version_id AS "templateVersionId", c.rating_model_id AS "ratingModelId",
              c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              COUNT(r.id)::int AS "reviewCount",
              COUNT(r.id) FILTER (WHERE r.released_at IS NOT NULL)::int AS "releasedCount"
         FROM "hr_performance_cycles" c
         LEFT JOIN "hr_performance_reviews" r ON r.cycle_id = c.id
        WHERE ($1::boolean = TRUE OR EXISTS (
          SELECT 1 FROM "hr_performance_reviews" visible
           WHERE visible.cycle_id = c.id
             AND (visible.employee_id = $2::uuid OR visible.reviewer_id = $2::uuid
               OR EXISTS (SELECT 1 FROM "hr_employees" report WHERE report.id = visible.employee_id AND report.manager_id = $2::uuid)
               OR EXISTS (SELECT 1 FROM "hr_appraisal_reviewers" ar WHERE ar.review_id = visible.id AND ar.reviewer_id = $2::uuid))
        ))
          AND ($3::uuid IS NULL OR c.company_id IS NULL OR c.company_id = $3::uuid)
        GROUP BY c.id ORDER BY c.start_date DESC LIMIT 50`,
      access.isHr,
      actorId,
      companyId,
    ), unavailableSources),
    actorId ? optionalRows('my appraisals', () => prisma.$queryRawUnsafe<Row[]>(
      `${REVIEW_SELECT} WHERE r.employee_id = $1::uuid ORDER BY c.start_date DESC`,
      actorId,
    ), unavailableSources) : [],
    actorId || access.isHr ? optionalRows('team appraisals', () => prisma.$queryRawUnsafe<Row[]>(
      `${REVIEW_SELECT}
        WHERE ($1::boolean = TRUE OR e.manager_id = $2::uuid OR r.reviewer_id = $2::uuid)
          AND ($3::uuid IS NULL OR e.company_id IS NULL OR e.company_id = $3::uuid)
        ORDER BY c.start_date DESC, e.first_name, e.last_name LIMIT 1000`,
      access.isHr,
      actorId,
      companyId,
    ), unavailableSources) : [],
    actorId ? optionalRows('review assignments', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT ar.id, ar.review_id AS "reviewId", ar.reviewer_id AS "reviewerId",
              ar.reviewer_role AS "reviewerRole", ar.is_required AS "isRequired",
              ar.is_anonymous AS "isAnonymous", ar.weight, ar.due_date AS "dueDate",
              ar.status, ar.rating, ar.submitted_at AS "submittedAt", ar.version,
              CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS "employeeName",
              e.job_title AS "jobTitle", c.name AS "cycleName"
         FROM "hr_appraisal_reviewers" ar
         JOIN "hr_performance_reviews" r ON r.id = ar.review_id
         JOIN "hr_performance_cycles" c ON c.id = r.cycle_id
         JOIN "hr_employees" e ON e.id = r.employee_id
        WHERE ar.reviewer_id = $1::uuid OR $2::boolean = TRUE
        ORDER BY ar.due_date, ar.created_at DESC LIMIT 500`,
      actorId,
      access.isHr,
    ), unavailableSources) : [],
    optionalRows('templates', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT t.id, t.name, t.description, t.status, t.current_version AS "currentVersion",
              tv.id AS "versionId", tv.version, tv.sections, tv.status AS "versionStatus",
              tv.created_at AS "createdAt"
         FROM "hr_appraisal_templates" t
         JOIN LATERAL (
           SELECT * FROM "hr_appraisal_template_versions"
            WHERE template_id = t.id ORDER BY version DESC LIMIT 1
         ) tv ON TRUE
        WHERE t.status <> 'archived'
          AND ($1::uuid IS NULL OR t.company_id IS NULL OR t.company_id = $1::uuid)
        ORDER BY t.name`,
      companyId,
    ), unavailableSources),
    optionalRows('rating models', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT id, name, description, scale_type AS "scaleType",
              minimum_score AS "minimumScore", maximum_score AS "maximumScore",
              rounding_decimals AS "roundingDecimals",
              missing_response_behavior AS "missingResponseBehavior",
              configuration, status
         FROM "hr_appraisal_rating_models"
        WHERE status <> 'archived'
          AND ($1::uuid IS NULL OR company_id IS NULL OR company_id = $1::uuid)
        ORDER BY name`,
      companyId,
    ), unavailableSources),
    optionalRows('rating levels', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT id, rating_model_id AS "ratingModelId", code, label, description,
              numeric_value AS "numericValue", minimum_score AS "minimumScore",
              maximum_score AS "maximumScore", display_order AS "displayOrder",
              semantic_status AS "semanticStatus", guidance
         FROM "hr_appraisal_rating_levels" ORDER BY rating_model_id, display_order`,
    ), unavailableSources),
    access.isHr ? optionalRows('calibration', () => prisma.$queryRawUnsafe<Row[]>(
      `${REVIEW_SELECT}
        WHERE r.status IN ('awaiting_calibration', 'calibration_in_progress', 'awaiting_final_approval', 'ready_for_release')
          AND ($1::uuid IS NULL OR e.company_id IS NULL OR e.company_id = $1::uuid)
        ORDER BY c.start_date DESC, department, "employeeName"`,
      companyId,
    ), unavailableSources) : [],
    optionalRows('approvals', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT a.id, a.review_id AS "reviewId", a.approval_role AS "approvalRole",
              a.sequence, a.approver_id AS "approverId", a.status, a.decision,
              a.comment, a.decided_at AS "decidedAt", a.created_at AS "createdAt"
         FROM "hr_appraisal_approvals" a
         JOIN "hr_performance_reviews" r ON r.id = a.review_id
        WHERE ($1::boolean = TRUE OR a.approver_id = $2::uuid OR r.employee_id = $2::uuid)
        ORDER BY a.review_id, a.sequence`,
      access.isHr,
      actorId,
    ), unavailableSources),
    optionalRows('appeals', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT a.id, a.review_id AS "reviewId", a.employee_id AS "employeeId",
              a.reason, a.status, a.submitted_at AS "submittedAt",
              a.manager_response AS "managerResponse", a.hr_decision AS "hrDecision",
              a.decided_at AS "decidedAt", a.version
         FROM "hr_appraisal_appeals" a
         JOIN "hr_employees" e ON e.id = a.employee_id
        WHERE ($1::boolean = TRUE OR a.employee_id = $2::uuid OR e.manager_id = $2::uuid)
        ORDER BY a.submitted_at DESC`,
      access.isHr,
      actorId,
    ), unavailableSources),
    optionalRows('timeline', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT ev.id, ev.cycle_id AS "cycleId", ev.review_id AS "reviewId",
              ev.event_type AS "eventType", ev.reason, ev.metadata,
              ev.created_at AS "createdAt",
              CASE WHEN ev.actor_id = $2::uuid THEN 'You' ELSE 'Authorized user' END AS actor
         FROM "hr_appraisal_events" ev
         LEFT JOIN "hr_performance_reviews" r ON r.id = ev.review_id
         LEFT JOIN "hr_employees" e ON e.id = r.employee_id
        WHERE $1::boolean = TRUE OR r.employee_id = $2::uuid OR e.manager_id = $2::uuid
        ORDER BY ev.created_at DESC LIMIT 200`,
      access.isHr,
      actorId,
    ), unavailableSources),
    access.canManage ? optionalRows('population preview', () => prisma.$queryRawUnsafe<Row[]>(
      `SELECT e.id, e.employee_number AS "employeeNumber",
              CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
              e.job_title AS "jobTitle", COALESCE(d.name, e.business_unit) AS department,
              CONCAT_WS(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS "managerName",
              CASE WHEN e.manager_id IS NULL THEN 'missing_manager' ELSE 'eligible' END AS eligibility,
              CASE WHEN e.manager_id IS NULL THEN 'Assign a manager before generation.' ELSE NULL END AS issue
         FROM "hr_employees" e
         LEFT JOIN "hr_departments" d ON d.id = e.department_id
         LEFT JOIN "hr_employees" m ON m.id = e.manager_id
        WHERE e.status IN ('active', 'probation', 'onboarding')
          AND ($1::uuid IS NULL OR e.company_id IS NULL OR e.company_id = $1::uuid)
        ORDER BY eligibility DESC, department, name
        LIMIT 500`,
      companyId,
    ), unavailableSources) : [],
  ]);

  const modelsWithLevels = ratingModels.map(model => ({
    ...model,
    levels: ratingLevels.filter(level => level.ratingModelId === model.id),
  }));
  const sanitizedOwn = ownReviews.map(row => sanitizeReview(row, access, 'self'));
  const sanitizedTeam = teamReviews.map(row => sanitizeReview(row, access, 'team'));

  return {
    permissions: {
      role: roleFor(access),
      canManage: access.canManage,
      canCalibrate: access.canManage,
      canApprove: access.canManage || access.isManager,
      canViewReports: access.isHr || access.isManager,
      canOverrideRating: access.canManage,
    },
    actorEmployeeId: actorId,
    cycles,
    reviews: sanitizedOwn,
    teamReviews: sanitizedTeam,
    reviewerAssignments: assignments,
    templates,
    ratingModels: modelsWithLevels,
    calibration,
    approvals,
    appeals,
    timeline,
    populationPreview,
    analytics: analyticsFor(access.isHr || access.isManager ? sanitizedTeam : sanitizedOwn, ratingLevels),
    meta: {
      generatedAt: new Date().toISOString(),
      partial: unavailableSources.length > 0,
      unavailableSources,
    },
  };
}

async function getScopedReview(db: Db, reviewId: string, access: AccessContext) {
  const rows = await db.$queryRawUnsafe<Row[]>(
    `${REVIEW_SELECT}
      WHERE r.id = $1::uuid
        AND (
          $2::boolean = TRUE
          OR r.employee_id = $3::uuid
          OR e.manager_id = $3::uuid
          OR r.reviewer_id = $3::uuid
          OR EXISTS (
            SELECT 1 FROM "hr_appraisal_reviewers" ar
             WHERE ar.review_id = r.id AND ar.reviewer_id = $3::uuid
          )
          OR EXISTS (
            SELECT 1 FROM "hr_appraisal_approvals" aa
             WHERE aa.review_id = r.id AND aa.approver_id = $3::uuid
          )
        )`,
    reviewId,
    access.isHr,
    access.actor?.id || null,
  );
  if (!rows[0]) throw new Error('This appraisal is outside your authorized scope.');
  return rows[0];
}

async function recordEvent(
  db: Db,
  input: {
    cycleId?: unknown;
    reviewId?: unknown;
    actorId?: string | null;
    eventType: string;
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string | null;
    metadata?: Row;
  },
) {
  await db.$executeRawUnsafe(
    `INSERT INTO "hr_appraisal_events"
       (id, cycle_id, review_id, actor_id, event_type, previous_value, new_value, reason, metadata, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::jsonb, $7::jsonb, $8, $9::jsonb, NOW())`,
    randomUUID(),
    input.cycleId || null,
    input.reviewId || null,
    input.actorId || null,
    input.eventType,
    input.previousValue == null ? null : JSON.stringify(input.previousValue),
    input.newValue == null ? null : JSON.stringify(input.newValue),
    input.reason || null,
    JSON.stringify(input.metadata || {}),
  );
}

async function updateWithVersion(
  db: Db,
  sql: string,
  params: unknown[],
  conflictMessage = 'This appraisal changed before your update. Refresh and try again.',
) {
  const changed = await db.$executeRawUnsafe(sql, ...params);
  if (changed !== 1) throw new Error(conflictMessage);
}

function requireManage(access: AccessContext) {
  if (!access.canManage) throw new Error('You do not have permission to administer Appraisal.');
}

function requireActor(access: AccessContext) {
  if (!access.actor) throw new Error('No employee record is linked to this user.');
  return access.actor;
}

async function previewPopulation(input: Extract<AppraisalMutation, { action: 'preview_population' }>, access: AccessContext) {
  requireManage(access);
  const statuses = input.employmentStatuses.length ? input.employmentStatuses : ['active'];
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT e.id, e.employee_number AS "employeeNumber",
            CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
            e.email, e.job_title AS "jobTitle", e.status,
            COALESCE(d.name, e.business_unit) AS department,
            e.department_id AS "departmentId", e.manager_id AS "managerId",
            CONCAT_WS(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS "managerName",
            CASE WHEN e.manager_id IS NULL THEN 'missing_manager' ELSE 'eligible' END AS eligibility,
            CASE WHEN e.manager_id IS NULL THEN 'Assign a manager before generation.' ELSE NULL END AS issue
       FROM "hr_employees" e
       LEFT JOIN "hr_departments" d ON d.id = e.department_id
       LEFT JOIN "hr_employees" m ON m.id = e.manager_id
      WHERE e.status = ANY($1::text[])
        AND ($2::uuid IS NULL OR e.company_id = $2::uuid)
        AND (cardinality($3::uuid[]) = 0 OR e.department_id = ANY($3::uuid[]))
        AND (cardinality($4::uuid[]) = 0 OR e.id = ANY($4::uuid[]))
        AND NOT (e.id = ANY($5::uuid[]))
      ORDER BY eligibility DESC, department, name
      LIMIT 2000`,
    statuses,
    input.companyId || access.actor?.companyId || null,
    input.departmentIds,
    input.employeeIds,
    input.excludedEmployeeIds,
  );
  return { populationPreview: rows, summary: {
    included: rows.length,
    eligible: rows.filter(row => row.eligibility === 'eligible').length,
    missingManager: rows.filter(row => row.eligibility === 'missing_manager').length,
    expectedReviewerCount: rows.filter(row => row.eligibility === 'eligible').length * 2,
  } };
}

async function notifyEmployee(employeeId: unknown, notification: { type: string; title: string; message: string; href: string }, actorId: string) {
  if (!employeeId) return false;
  const users = await prisma.$queryRawUnsafe<Array<{ userId: string | null }>>(
    `SELECT user_id AS "userId" FROM "hr_employees" WHERE id = $1::uuid`,
    employeeId,
  );
  if (!users[0]?.userId) return false;
  const created = await NotificationService.createNotification(users[0].userId, {
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: { href: notification.href, entityType: 'appraisal' },
  }, actorId).catch(error => {
    console.warn('[Appraisal] Notification failed:', error);
    return null;
  });
  return Boolean(created);
}

export async function mutateAppraisalWorkspace(user: SessionUser, input: AppraisalMutation) {
  const access = await buildAccess(user);
  const actor = access.actor;

  if (input.action === 'preview_population') {
    return previewPopulation(input, access);
  }

  if (input.action === 'send_reminders') {
    if (!(access.isHr || access.isManager)) throw new Error('You do not have permission to send appraisal reminders.');
    let sent = 0;
    let skipped = 0;
    for (const reviewId of [...new Set(input.reviewIds)]) {
      const review = await getScopedReview(prisma, reviewId, access);
      const status = String(review.status);
      const targets: unknown[] = [];
      if (['not_started', 'awaiting_employee_submission', 'self_assessment_in_progress', 'returned_for_revision', 'acknowledgment_pending', 'released'].includes(status)) {
        targets.push(review.employeeId);
      } else if (['awaiting_manager_review', 'manager_review_in_progress'].includes(status)) {
        targets.push(review.employeeManagerId || review.managerId);
      } else if (status === 'awaiting_peer_review') {
        const reviewers = await prisma.$queryRawUnsafe<Array<{ reviewerId: string }>>(
          `SELECT reviewer_id AS "reviewerId" FROM "hr_appraisal_reviewers"
            WHERE review_id = $1::uuid AND status NOT IN ('submitted', 'declined')`,
          reviewId,
        );
        targets.push(...reviewers.map(item => item.reviewerId));
      }
      if (!targets.length) {
        skipped += 1;
        continue;
      }
      let reviewSent = 0;
      for (const target of [...new Set(targets.map(String))]) {
        const delivered = await notifyEmployee(target, {
          type: 'performance_review_reminder',
          title: 'Appraisal action reminder',
          message: `${String(review.cycleName || 'Your appraisal')} has an action waiting for completion.`,
          href: status.includes('manager') || status === 'awaiting_peer_review'
            ? `/workforce/performance?tab=appraisal&appraisalTab=${status === 'awaiting_peer_review' ? 'feedback' : 'team'}&review=${reviewId}`
            : `/workforce/performance?tab=appraisal&appraisalTab=my-reviews&review=${reviewId}`,
        }, user.id);
        if (delivered) reviewSent += 1;
      }
      if (reviewSent) {
        sent += reviewSent;
        await recordEvent(prisma, { cycleId: review.cycleId, reviewId, actorId: user.id, eventType: 'reminder_sent', metadata: { recipients: reviewSent, status } });
      } else {
        skipped += 1;
      }
    }
    return { sent, skipped };
  }

  if (input.action === 'create_cycle') {
    requireManage(access);
    const cycle = await prisma.$transaction(async tx => {
      const existing = await tx.$queryRawUnsafe<Row[]>(
        `SELECT id FROM "hr_performance_cycles"
          WHERE configuration->>'idempotencyKey' = $1 LIMIT 1`,
        input.idempotencyKey,
      );
      if (existing[0]) throw new Error('This cycle action was already completed.');
      const rows = await tx.$queryRawUnsafe<Row[]>(
        `INSERT INTO "hr_performance_cycles"
          (id, name, description, review_type, start_date, end_date, self_due_date,
           manager_due_date, release_date, company_id, population_config,
           workflow_config, configuration, template_version_id, rating_model_id,
           created_by_id, status, version, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4, $5::date, $6::date, $7::date, $8::date,
                 $9::date, $10::uuid, $11::jsonb, $12::jsonb, $13::jsonb,
                 $14::uuid, $15::uuid, $16::uuid, 'draft', 1, NOW(), NOW())
         RETURNING id, name, status, version`,
        randomUUID(),
        input.name,
        input.description || null,
        input.reviewType,
        input.startDate,
        input.endDate,
        input.selfDueDate,
        input.managerDueDate,
        input.releaseDate || null,
        input.population.companyId || actor?.companyId || null,
        JSON.stringify(input.population),
        JSON.stringify({ sequential: true, steps: ['manager', 'hr', input.requireCalibration ? 'calibration' : null, 'final_hr'].filter(Boolean) }),
        JSON.stringify({ requirePeerReview: input.requirePeerReview, requireCalibration: input.requireCalibration, idempotencyKey: input.idempotencyKey }),
        input.templateVersionId,
        input.ratingModelId,
        user.id,
      );
      await recordEvent(tx, {
        cycleId: rows[0].id,
        actorId: user.id,
        eventType: 'cycle_created',
        newValue: rows[0],
      });
      return rows[0];
    });
    return { cycle };
  }

  if (input.action === 'create_template') {
    requireManage(access);
    const template = await prisma.$transaction(async tx => {
      const existing = await tx.$queryRawUnsafe<Row[]>(
        `SELECT id FROM "hr_appraisal_templates"
          WHERE description LIKE $1 LIMIT 1`,
        `%[idempotency:${input.idempotencyKey}]%`,
      );
      if (existing[0]) throw new Error('This template action was already completed.');
      const templateId = randomUUID();
      const versionId = randomUUID();
      const description = `${input.description || ''}${input.description ? '\n' : ''}[idempotency:${input.idempotencyKey}]`;
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_templates"
          (id, name, description, status, company_id, current_version, created_by_id, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, 'active', $4::uuid, 1, $5::uuid, NOW(), NOW())`,
        templateId, input.name, description, actor?.companyId || null, user.id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_template_versions"
          (id, template_id, version, sections, calculation_config, visibility_config,
           status, published_by_id, published_at, created_at)
         VALUES ($1::uuid, $2::uuid, 1, $3::jsonb, $4::jsonb, '{}'::jsonb,
                 'published', $5::uuid, NOW(), NOW())`,
        versionId,
        templateId,
        JSON.stringify(input.sections),
        JSON.stringify({ sectionWeights: Object.fromEntries(input.sections.map(section => [section.key, section.weight])) }),
        user.id,
      );
      await recordEvent(tx, { actorId: user.id, eventType: 'template_created', newValue: { templateId, versionId, name: input.name } });
      return { id: templateId, versionId, name: input.name, version: 1 };
    });
    return { template };
  }

  if (input.action === 'generate_population') {
    requireManage(access);
    const generated = await prisma.$transaction(async tx => {
      const cycles = await tx.$queryRawUnsafe<Row[]>(
        `SELECT * FROM "hr_performance_cycles"
          WHERE id = $1::uuid AND version = $2 FOR UPDATE`,
        input.cycleId,
        input.expectedVersion,
      );
      const cycle = cycles[0];
      if (!cycle) throw new Error('The cycle changed before population generation. Refresh and try again.');
      const config = parseJson<{
        companyId?: string | null;
        departmentIds?: string[];
        employeeIds?: string[];
        excludedEmployeeIds?: string[];
        employmentStatuses?: string[];
      }>(cycle.population_config, {});
      const population = await tx.$queryRawUnsafe<EmployeeRow[]>(
        `SELECT e.id, e.user_id AS "userId", e.employee_number AS "employeeNumber",
                CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
                e.email, e.job_title AS "jobTitle", e.department_id AS "departmentId",
                COALESCE(d.name, e.business_unit) AS department, e.manager_id AS "managerId",
                CONCAT_WS(' ', COALESCE(m.preferred_name, m.first_name), m.last_name) AS "managerName",
                e.company_id AS "companyId", e.status
           FROM "hr_employees" e
           LEFT JOIN "hr_departments" d ON d.id = e.department_id
           LEFT JOIN "hr_employees" m ON m.id = e.manager_id
          WHERE e.status = ANY($1::text[])
            AND ($2::uuid IS NULL OR e.company_id = $2::uuid)
            AND (cardinality($3::uuid[]) = 0 OR e.department_id = ANY($3::uuid[]))
            AND (cardinality($4::uuid[]) = 0 OR e.id = ANY($4::uuid[]))
            AND NOT (e.id = ANY($5::uuid[]))
            AND e.manager_id IS NOT NULL`,
        config.employmentStatuses?.length ? config.employmentStatuses : ['active'],
        config.companyId || cycle.company_id || null,
        config.departmentIds || [],
        config.employeeIds || [],
        config.excludedEmployeeIds || [],
      );
      let inserted = 0;
      for (const employee of population) {
        const reviewRows = await tx.$queryRawUnsafe<Row[]>(
          `INSERT INTO "hr_performance_reviews"
            (id, cycle_id, employee_id, reviewer_id, status, template_version_id,
             rating_model_id, version, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'not_started',
                   $5::uuid, $6::uuid, 1, NOW(), NOW())
           ON CONFLICT (cycle_id, employee_id) DO NOTHING
           RETURNING id`,
          randomUUID(),
          input.cycleId,
          employee.id,
          employee.managerId,
          cycle.template_version_id,
          cycle.rating_model_id,
        );
        if (!reviewRows[0]) continue;
        inserted += 1;
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_reviewers"
            (id, review_id, reviewer_id, reviewer_role, is_required, weight,
             due_date, status, idempotency_key, version, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3::uuid, 'manager', TRUE, 100,
                   $4, 'not_started', $5, 1, NOW(), NOW())
           ON CONFLICT (review_id, reviewer_id, reviewer_role) DO NOTHING`,
          randomUUID(),
          reviewRows[0].id,
          employee.managerId,
          cycle.manager_due_date,
          `${input.idempotencyKey}:${employee.id}:manager`,
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_approvals"
            (id, review_id, approval_role, sequence, approver_id, status, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, 'manager', 1, $3::uuid, 'pending', NOW(), NOW())`,
          randomUUID(),
          reviewRows[0].id,
          employee.managerId,
        );
      }
      await tx.$executeRawUnsafe(
        `UPDATE "hr_performance_cycles"
            SET status = CASE WHEN status = 'draft' THEN 'preparing' ELSE status END,
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid`,
        input.cycleId,
      );
      await recordEvent(tx, {
        cycleId: input.cycleId,
        actorId: user.id,
        eventType: 'population_generated',
        newValue: { inserted, eligible: population.length },
        metadata: { idempotencyKey: input.idempotencyKey },
      });
      return { inserted, alreadyIncluded: population.length - inserted, eligible: population.length };
    });
    return { generated };
  }

  if (input.action === 'change_cycle_stage') {
    requireManage(access);
    await prisma.$transaction(async tx => {
      const previous = await tx.$queryRawUnsafe<Row[]>(
        `SELECT id, status, version FROM "hr_performance_cycles" WHERE id = $1::uuid`,
        input.cycleId,
      );
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_cycles"
            SET status = $2, version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $3`,
        [input.cycleId, input.status, input.expectedVersion],
        'The cycle stage changed before your update. Refresh and try again.',
      );
      if (input.status === 'self_assessment') {
        await tx.$executeRawUnsafe(
          `UPDATE "hr_performance_reviews"
              SET status = 'awaiting_employee_submission', version = version + 1, updated_at = NOW()
            WHERE cycle_id = $1::uuid AND status = 'not_started'`,
          input.cycleId,
        );
      }
      await recordEvent(tx, {
        cycleId: input.cycleId,
        actorId: user.id,
        eventType: 'cycle_stage_changed',
        previousValue: previous[0],
        newValue: { status: input.status },
        reason: input.reason,
      });
    });
    return { status: input.status };
  }

  if (input.action === 'save_self_assessment') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    if (review.employeeId !== employee.id) throw new Error('Employees may only edit their own appraisal.');
    if (!['not_started', 'awaiting_employee_submission', 'self_assessment_in_progress', 'returned_for_revision'].includes(String(review.status))) {
      throw new Error('This self-assessment is locked at the current review stage.');
    }
    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET self_responses = $2::jsonb, self_assessment = $3, strengths = $4,
                development_areas = $5, career_aspiration = $6,
                status = 'self_assessment_in_progress', version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND employee_id = $7::uuid AND version = $8`,
        [
          input.reviewId,
          JSON.stringify(input.responses),
          input.summary || null,
          input.strengths || null,
          input.developmentAreas || null,
          input.careerAspiration || null,
          employee.id,
          input.expectedVersion,
        ],
      );
      for (const evaluation of input.goalEvaluations) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_goal_evaluations"
            (id, review_id, goal_id, reviewer_role, reviewer_id, rating, comment, evidence,
             goal_snapshot, created_at, updated_at)
           SELECT $1::uuid, $2::uuid, g.id, 'self', $3::uuid, $4, $5, $6::jsonb,
                  jsonb_build_object('title', g.title, 'progress', g.progress, 'status', g.status,
                    'keyResults', g.key_results, 'capturedAt', NOW()), NOW(), NOW()
             FROM "hr_performance_goals" g
            WHERE g.id = $7::uuid AND g.employee_id = $3::uuid
           ON CONFLICT (review_id, goal_id, reviewer_role, reviewer_id)
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                         evidence = EXCLUDED.evidence, updated_at = NOW()`,
          randomUUID(), input.reviewId, employee.id, evaluation.rating,
          evaluation.comment || null, JSON.stringify(evaluation.evidence), evaluation.itemId,
        );
      }
      for (const evaluation of input.competencyEvaluations) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_competency_evaluations"
            (id, review_id, competency_key, competency_snapshot, reviewer_role,
             reviewer_id, rating, comment, evidence, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, 'self', $5::uuid,
                   $6, $7, $8::jsonb, NOW(), NOW())
           ON CONFLICT (review_id, competency_key, reviewer_role, reviewer_id)
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                         evidence = EXCLUDED.evidence, updated_at = NOW()`,
          randomUUID(), input.reviewId, evaluation.itemId,
          JSON.stringify({ key: evaluation.itemId, capturedAt: new Date().toISOString() }),
          employee.id, evaluation.rating, evaluation.comment || null, JSON.stringify(evaluation.evidence),
        );
      }
      await recordEvent(tx, { cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id, eventType: 'self_assessment_saved' });
    });
    return { saved: true };
  }

  if (input.action === 'submit_self_assessment') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    if (review.employeeId !== employee.id) throw new Error('Employees may only submit their own appraisal.');
    if (!String(review.selfAssessment || '').trim() && !Object.keys(parseJson<Row>(review.selfResponses, {})).length) {
      throw new Error('Complete the required self-assessment sections before submission.');
    }
    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET status = 'awaiting_manager_review', submitted_at = NOW(),
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND employee_id = $2::uuid AND version = $3
            AND status IN ('self_assessment_in_progress', 'returned_for_revision', 'awaiting_employee_submission')`,
        [input.reviewId, employee.id, input.expectedVersion],
      );
      await recordEvent(tx, { cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id, eventType: 'self_assessment_submitted' });
    });
    await notifyEmployee(review.employeeManagerId, {
      type: 'appraisal_manager_review_required',
      title: 'Manager assessment ready',
      message: `${String(review.employeeName)} submitted their self-assessment.`,
      href: `/workforce/performance?tab=appraisal&appraisalTab=team&review=${input.reviewId}`,
    }, user.id);
    return { submitted: true };
  }

  if (input.action === 'save_manager_assessment' || input.action === 'submit_manager_assessment') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    const authorized = access.isHr || review.employeeManagerId === employee.id || review.managerId === employee.id;
    if (!authorized) throw new Error('Only the assigned manager or authorized HR user may assess this employee.');
    if (input.action === 'submit_manager_assessment') {
      if (!review.managerRating || !String(review.managerComments || review.managerAssessment || '').trim()) {
        throw new Error('Save a manager rating and comments before submission.');
      }
      const requiresCalibration = Boolean(parseJson<Row>(review.cycleConfiguration, {}).requireCalibration ?? true);
      await prisma.$transaction(async tx => {
        await updateWithVersion(
          tx,
          `UPDATE "hr_performance_reviews"
              SET status = $2, version = version + 1, updated_at = NOW()
            WHERE id = $1::uuid AND version = $3
              AND status IN ('awaiting_manager_review', 'manager_review_in_progress', 'returned_for_revision')`,
          [input.reviewId, requiresCalibration ? 'awaiting_calibration' : 'awaiting_final_approval', input.expectedVersion],
        );
        await tx.$executeRawUnsafe(
          `UPDATE "hr_appraisal_reviewers"
              SET status = 'submitted', submitted_at = NOW(), version = version + 1, updated_at = NOW()
            WHERE review_id = $1::uuid AND reviewer_role = 'manager'`,
          input.reviewId,
        );
        await recordEvent(tx, { cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id, eventType: 'manager_assessment_submitted' });
      });
      return { submitted: true };
    }

    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET manager_rating = $2, manager_comments = $3, manager_assessment = $3,
                strengths = COALESCE($4, strengths), development_areas = COALESCE($5, development_areas),
                development_recommendation = $6, status = 'manager_review_in_progress',
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $7
            AND status IN ('awaiting_manager_review', 'manager_review_in_progress', 'returned_for_revision')`,
        [
          input.reviewId, input.rating, input.comments, input.strengths || null,
          input.developmentAreas || null, input.developmentRecommendation || null, input.expectedVersion,
        ],
      );
      for (const evaluation of input.goalEvaluations) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_goal_evaluations"
            (id, review_id, goal_id, reviewer_role, reviewer_id, rating, comment, evidence,
             goal_snapshot, created_at, updated_at)
           SELECT $1::uuid, $2::uuid, g.id, 'manager', $3::uuid, $4, $5, $6::jsonb,
                  jsonb_build_object('title', g.title, 'progress', g.progress, 'status', g.status,
                    'keyResults', g.key_results, 'capturedAt', NOW()), NOW(), NOW()
             FROM "hr_performance_goals" g WHERE g.id = $7::uuid AND g.employee_id = $8::uuid
           ON CONFLICT (review_id, goal_id, reviewer_role, reviewer_id)
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                         evidence = EXCLUDED.evidence, updated_at = NOW()`,
          randomUUID(), input.reviewId, employee.id, evaluation.rating,
          evaluation.comment || null, JSON.stringify(evaluation.evidence), evaluation.itemId, review.employeeId,
        );
      }
      for (const evaluation of input.competencyEvaluations) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "hr_appraisal_competency_evaluations"
            (id, review_id, competency_key, competency_snapshot, reviewer_role,
             reviewer_id, rating, comment, evidence, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, 'manager', $5::uuid,
                   $6, $7, $8::jsonb, NOW(), NOW())
           ON CONFLICT (review_id, competency_key, reviewer_role, reviewer_id)
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment,
                         evidence = EXCLUDED.evidence, updated_at = NOW()`,
          randomUUID(), input.reviewId, evaluation.itemId,
          JSON.stringify({ key: evaluation.itemId, capturedAt: new Date().toISOString() }),
          employee.id, evaluation.rating, evaluation.comment || null, JSON.stringify(evaluation.evidence),
        );
      }
      await recordEvent(tx, { cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id, eventType: 'manager_assessment_saved' });
    });
    return { saved: true };
  }

  if (input.action === 'assign_reviewer') {
    requireManage(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_reviewers"
          (id, review_id, reviewer_id, reviewer_role, is_required, is_anonymous,
           weight, due_date, status, idempotency_key, version, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::date,
                 'not_started', $9, 1, NOW(), NOW())
         ON CONFLICT (review_id, reviewer_id, reviewer_role) DO NOTHING`,
        randomUUID(), input.reviewId, input.reviewerId, input.reviewerRole,
        input.isRequired, input.isAnonymous, input.weight, input.dueDate, input.idempotencyKey,
      );
      await recordEvent(tx, {
        cycleId: review.cycleId,
        reviewId: input.reviewId,
        actorId: user.id,
        eventType: 'reviewer_assigned',
        newValue: { reviewerRole: input.reviewerRole, dueDate: input.dueDate, anonymous: input.isAnonymous },
      });
    });
    await notifyEmployee(input.reviewerId, {
      type: 'appraisal_peer_review_requested',
      title: 'Appraisal feedback requested',
      message: `You have been assigned a ${input.reviewerRole.replace(/_/g, ' ')} review.`,
      href: `/workforce/performance?tab=appraisal&appraisalTab=feedback`,
    }, user.id);
    return { assigned: true };
  }

  if (input.action === 'submit_peer_review') {
    const employee = requireActor(access);
    const assignments = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT ar.*, r.cycle_id AS "cycleId", r.employee_id AS "employeeId"
         FROM "hr_appraisal_reviewers" ar
         JOIN "hr_performance_reviews" r ON r.id = ar.review_id
        WHERE ar.id = $1::uuid AND ar.reviewer_id = $2::uuid`,
      input.assignmentId, employee.id,
    );
    const assignment = assignments[0];
    if (!assignment) throw new Error('This review assignment is outside your authorized scope.');
    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_appraisal_reviewers"
            SET rating = $2, strengths = $3, development_areas = $4,
                comments = $5, responses = $6::jsonb, status = 'submitted',
                submitted_at = NOW(), version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND reviewer_id = $7::uuid AND version = $8
            AND status NOT IN ('submitted', 'declined')`,
        [
          input.assignmentId, input.rating, input.strengths, input.developmentAreas,
          input.comments || null, JSON.stringify(input.responses), employee.id, input.expectedVersion,
        ],
      );
      await recordEvent(tx, {
        cycleId: assignment.cycleId,
        reviewId: assignment.review_id,
        actorId: user.id,
        eventType: 'peer_review_submitted',
        metadata: { reviewerRole: assignment.reviewer_role, anonymous: assignment.is_anonymous },
      });
    });
    return { submitted: true };
  }

  if (input.action === 'calculate_rating') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    if (!(access.isHr || review.employeeManagerId === employee.id)) throw new Error('You do not have permission to calculate this rating.');
    const [goalRows, competencyRows, peerRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ average: number | null }>>(
        `SELECT AVG(rating)::float AS average FROM "hr_appraisal_goal_evaluations"
          WHERE review_id = $1::uuid AND reviewer_role = 'manager'`,
        input.reviewId,
      ),
      prisma.$queryRawUnsafe<Array<{ average: number | null }>>(
        `SELECT AVG(rating)::float AS average FROM "hr_appraisal_competency_evaluations"
          WHERE review_id = $1::uuid AND reviewer_role = 'manager'`,
        input.reviewId,
      ),
      prisma.$queryRawUnsafe<Array<{ average: number | null }>>(
        `SELECT AVG(rating)::float AS average FROM "hr_appraisal_reviewers"
          WHERE review_id = $1::uuid AND reviewer_role NOT IN ('self', 'manager') AND status = 'submitted'`,
        input.reviewId,
      ),
    ]);
    const config = parseJson<{ weights?: { goals?: number; competencies?: number; manager?: number; peer?: number }; missingBehavior?: 'exclude' | 'zero' | 'block' }>(review.ratingConfiguration, {});
    const weights = config.weights || { goals: 40, competencies: 30, manager: 30, peer: 0 };
    const result = calculateWeightedRating([
      { score: goalRows[0]?.average, weight: weights.goals ?? 40, required: (weights.goals ?? 40) > 0 },
      { score: competencyRows[0]?.average, weight: weights.competencies ?? 30, required: (weights.competencies ?? 30) > 0 },
      { score: Number(review.managerRating ?? null), weight: weights.manager ?? 30, required: (weights.manager ?? 30) > 0 },
      { score: peerRows[0]?.average, weight: weights.peer ?? 0, required: false },
    ], { missingBehavior: config.missingBehavior || 'block' });
    if (result.score == null) throw new Error(result.reason || 'The rating cannot be calculated yet.');
    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET calculated_rating = $2, goal_result = $3, competency_result = $4,
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $5`,
        [input.reviewId, result.score, goalRows[0]?.average, competencyRows[0]?.average, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: 'rating_calculated', newValue: { score: result.score, weights },
      });
    });
    return { rating: result.score };
  }

  if (input.action === 'override_rating') {
    requireManage(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    const original = Number(review.calibratedRating ?? review.managerRating ?? review.calculatedRating ?? 0);
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_rating_adjustments"
          (id, review_id, adjustment_type, original_rating, new_rating, reason,
           comment, actor_id, created_at)
         VALUES ($1::uuid, $2::uuid, 'manual_override', $3, $4, $5, $6, $7::uuid, NOW())`,
        randomUUID(), input.reviewId, original, input.newRating, input.reason, input.comment, user.id,
      );
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET calibrated_rating = $2, version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $3`,
        [input.reviewId, input.newRating, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: 'rating_overridden', previousValue: { rating: original },
        newValue: { rating: input.newRating }, reason: input.reason,
      });
    });
    return { rating: input.newRating };
  }

  if (input.action === 'calibrate_rating') {
    requireManage(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    const nextStatus = input.decision === 'returned'
      ? 'returned_for_revision'
      : input.decision === 'additional_information'
        ? 'awaiting_calibration'
        : 'awaiting_final_approval';
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_calibration_decisions"
          (id, review_id, decision, proposed_rating, calibrated_rating, notes, actor_id, created_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, NOW())`,
        randomUUID(), input.reviewId, input.decision,
        review.managerRating ?? review.calculatedRating ?? null,
        input.calibratedRating, input.notes, user.id,
      );
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET calibrated_rating = $2, status = $3, version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $4`,
        [input.reviewId, input.calibratedRating, nextStatus, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: 'calibration_decision', previousValue: { rating: review.managerRating ?? review.calculatedRating },
        newValue: { rating: input.calibratedRating, decision: input.decision }, reason: input.notes,
      });
    });
    return { status: nextStatus, rating: input.calibratedRating };
  }

  if (input.action === 'approval_decision') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    const authorized = access.canManage || (await prisma.$queryRawUnsafe<Row[]>(
      `SELECT id FROM "hr_appraisal_approvals"
        WHERE review_id = $1::uuid AND approver_id = $2::uuid AND status = 'pending' LIMIT 1`,
      input.reviewId, employee.id,
    )).length > 0;
    if (!authorized) throw new Error('You are not the assigned approver for this appraisal.');
    const nextStatus = input.decision === 'approved' ? 'ready_for_release'
      : input.decision === 'returned' ? 'returned_for_revision' : 'cancelled';
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        `UPDATE "hr_appraisal_approvals"
            SET status = $3, decision = $3, comment = $4, previous_status = $5,
                new_status = $6, decided_at = NOW(), updated_at = NOW()
          WHERE review_id = $1::uuid
            AND ($2::boolean = TRUE OR approver_id = $7::uuid)
            AND status = 'pending'`,
        input.reviewId, access.canManage, input.decision, input.comment,
        review.status, nextStatus, employee.id,
      );
      const finalRating = input.decision === 'approved'
        ? Number(review.calibratedRating ?? review.managerRating ?? review.calculatedRating)
        : null;
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET status = $2, final_rating = COALESCE($3, final_rating),
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $4`,
        [input.reviewId, nextStatus, finalRating, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: `approval_${input.decision}`, previousValue: { status: review.status },
        newValue: { status: nextStatus, finalRating }, reason: input.comment,
      });
    });
    return { status: nextStatus };
  }

  if (input.action === 'release_result') {
    requireManage(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    const finalRating = Number(review.finalRating ?? review.calibratedRating ?? review.managerRating ?? review.calculatedRating);
    if (!Number.isFinite(finalRating)) throw new Error('A final rating is required before release.');
    if (!String(review.managerComments || review.managerAssessment || '').trim()) throw new Error('Manager comments are required before release.');
    if (String(review.status) !== 'ready_for_release') {
      throw new Error('Complete required approval and calibration stages before release.');
    }
    const pendingReviewers = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "hr_appraisal_reviewers"
        WHERE review_id = $1::uuid AND is_required = TRUE
          AND status NOT IN ('submitted', 'declined')`,
      input.reviewId,
    );
    if (Number(pendingReviewers[0]?.count || 0) > 0) {
      throw new Error('All required reviewer assignments must be submitted before release.');
    }
    await prisma.$transaction(async tx => {
      const duplicate = await tx.$queryRawUnsafe<Row[]>(
        `SELECT id FROM "hr_appraisal_events"
          WHERE review_id = $1::uuid AND metadata->>'idempotencyKey' = $2 LIMIT 1`,
        input.reviewId, input.idempotencyKey,
      );
      if (duplicate[0]) throw new Error('This release action was already completed.');
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET status = 'released', final_rating = $2, rating = $2,
                released_at = NOW(), released_by_id = $3::uuid,
                acknowledgment_status = 'acknowledgment_pending',
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $4 AND released_at IS NULL`,
        [input.reviewId, finalRating, user.id, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: 'result_released', newValue: { finalRating, status: 'released' },
        metadata: { idempotencyKey: input.idempotencyKey },
      });
    });
    await notifyEmployee(review.employeeId, {
      type: 'appraisal_released',
      title: 'Your appraisal is ready',
      message: `${String(review.cycleName)} has been released. Review and acknowledge receipt.`,
      href: `/workforce/performance?tab=appraisal&appraisalTab=my-reviews&review=${input.reviewId}`,
    }, user.id);
    return { released: true };
  }

  if (input.action === 'acknowledge_result') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    if (review.employeeId !== employee.id) throw new Error('Employees may only acknowledge their own released appraisal.');
    if (!review.releasedAt) throw new Error('This appraisal has not been released.');
    const status = input.requestDiscussion ? 'discussion_requested' : 'acknowledged';
    await prisma.$transaction(async tx => {
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET status = $2, acknowledgment_status = $2, acknowledgment_comment = $3,
                acknowledged_at = CASE WHEN $4::boolean THEN NULL ELSE NOW() END,
                discussion_requested_at = CASE WHEN $4::boolean THEN NOW() ELSE NULL END,
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND employee_id = $5::uuid AND version = $6 AND released_at IS NOT NULL`,
        [input.reviewId, status, input.comment || null, input.requestDiscussion, employee.id, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: input.requestDiscussion ? 'discussion_requested' : 'result_acknowledged',
        newValue: { status, comment: input.comment || null },
        reason: input.comment || null,
      });
    });
    return { status };
  }

  if (input.action === 'submit_appeal') {
    const employee = requireActor(access);
    const review = await getScopedReview(prisma, input.reviewId, access);
    if (review.employeeId !== employee.id) throw new Error('Employees may only appeal their own released appraisal.');
    if (!review.releasedAt) throw new Error('Only a released appraisal may be appealed.');
    await prisma.$transaction(async tx => {
      const existing = await tx.$queryRawUnsafe<Row[]>(
        `SELECT id FROM "hr_appraisal_appeals"
          WHERE review_id = $1::uuid AND status NOT IN ('closed', 'rejected') LIMIT 1`,
        input.reviewId,
      );
      if (existing[0]) throw new Error('An active appeal already exists for this appraisal.');
      await tx.$executeRawUnsafe(
        `INSERT INTO "hr_appraisal_appeals"
          (id, review_id, employee_id, original_result, reason, evidence, status,
           submitted_at, version, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::jsonb, $5, $6::jsonb,
                 'submitted', NOW(), 1, NOW(), NOW())`,
        randomUUID(), input.reviewId, employee.id,
        JSON.stringify({
          finalRating: review.finalRating,
          managerComments: review.managerComments,
          releasedAt: review.releasedAt,
        }),
        input.reason,
        JSON.stringify(input.evidence),
      );
      await updateWithVersion(
        tx,
        `UPDATE "hr_performance_reviews"
            SET status = 'disputed', acknowledgment_status = 'disputed',
                version = version + 1, updated_at = NOW()
          WHERE id = $1::uuid AND version = $2`,
        [input.reviewId, input.expectedVersion],
      );
      await recordEvent(tx, {
        cycleId: review.cycleId, reviewId: input.reviewId, actorId: user.id,
        eventType: 'appeal_submitted', newValue: { status: 'submitted' }, reason: input.reason,
      });
    });
    return { status: 'disputed' };
  }

  throw new Error('This appraisal action is not supported.');
}
