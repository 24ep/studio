import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import { hasAnyPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';
import { NotificationService } from '@/lib/notificationService';
import type {
  PerformanceAlert,
  PerformanceEmployeeSummary,
  PerformanceMutation,
  PerformanceWorkspaceData,
} from './performance-contracts';
import {
  canViewManagerPrivateNotes,
  derivePerformancePermissions,
  shouldRevealRating,
  toPerformanceStatus,
} from './performance-contracts';

type SessionUser = {
  id: string;
  email?: string | null;
  role?: string;
  modulePermissions?: PlatformModuleId[];
};

type EmployeeRow = {
  id: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  managerId: string | null;
  managerName: string | null;
  profilePhotoUrl: string | null;
  companyId: string | null;
};

function employeeName(employee: Pick<EmployeeRow, 'firstName' | 'lastName' | 'preferredName'>) {
  return [employee.preferredName || employee.firstName, employee.lastName].filter(Boolean).join(' ');
}

function toEmployeeSummary(employee: EmployeeRow): PerformanceEmployeeSummary {
  return {
    id: employee.id,
    name: employeeName(employee),
    employeeNumber: employee.employeeNumber,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    location: employee.location,
    managerId: employee.managerId,
    managerName: employee.managerName,
    profilePhotoUrl: employee.profilePhotoUrl,
  };
}

async function findActorEmployee(userId: string, email?: string | null) {
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT e.id,
            e.user_id AS "userId",
            e.employee_number AS "employeeNumber",
            e.first_name AS "firstName",
            e.last_name AS "lastName",
            e.preferred_name AS "preferredName",
            e.email,
            e.job_title AS "jobTitle",
            COALESCE(d.name, e.business_unit) AS department,
            e.location,
            e.manager_id AS "managerId",
            CONCAT_WS(' ', manager.preferred_name, manager.last_name) AS "managerName",
            e.profile_photo_url AS "profilePhotoUrl",
            e.company_id AS "companyId"
     FROM "hr_employees" e
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     LEFT JOIN "hr_employees" manager ON manager.id = e.manager_id
     WHERE e.user_id = $1::uuid OR lower(e.email) = lower($2)
     ORDER BY CASE WHEN e.user_id = $1::uuid THEN 0 ELSE 1 END
     LIMIT 1`,
    userId,
    email || '',
  );
  return rows[0] || null;
}

function hasPerformancePermission(user: SessionUser, permission: PlatformModuleId) {
  return hasAnyPermission(user, [permission]);
}

async function buildAccessContext(user: SessionUser) {
  const actorEmployee = await findActorEmployee(user.id, user.email);
  const [directReportCount] = actorEmployee
    ? await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "hr_employees" WHERE manager_id = $1::uuid AND status = 'active'`,
      actorEmployee.id,
    )
    : [{ count: 0 }];
  const isAdministrator = user.role === 'Admin';
  const canManagePerformance = isAdministrator || hasPerformancePermission(user, 'HR_PERFORMANCE_MANAGE');
  const hasHrView = isAdministrator || canManagePerformance || hasPerformancePermission(user, 'HR_PERFORMANCE_VIEW');
  const isManager = Number(directReportCount?.count || 0) > 0;

  return {
    actorEmployee,
    isAdministrator,
    hasHrView,
    isManager,
    permissions: derivePerformancePermissions({
      isAdministrator,
      hasHrView,
      isManager,
      canManagePerformance,
    }),
  };
}

export async function canAccessPerformanceManagement(user: SessionUser) {
  const access = await buildAccessContext(user);
  return access.permissions.canViewTeam;
}

async function listAccessibleEmployees(
  actorEmployee: EmployeeRow | null,
  access: Awaited<ReturnType<typeof buildAccessContext>>,
) {
  const companyFilter = actorEmployee?.companyId || null;
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT e.id,
            e.user_id AS "userId",
            e.employee_number AS "employeeNumber",
            e.first_name AS "firstName",
            e.last_name AS "lastName",
            e.preferred_name AS "preferredName",
            e.email,
            e.job_title AS "jobTitle",
            COALESCE(d.name, e.business_unit) AS department,
            e.location,
            e.manager_id AS "managerId",
            CONCAT_WS(' ', manager.preferred_name, manager.last_name) AS "managerName",
            e.profile_photo_url AS "profilePhotoUrl",
            e.company_id AS "companyId"
     FROM "hr_employees" e
     LEFT JOIN "hr_departments" d ON d.id = e.department_id
     LEFT JOIN "hr_employees" manager ON manager.id = e.manager_id
     WHERE e.status IN ('active', 'probation', 'onboarding')
       AND ($1::uuid IS NULL OR e.company_id IS NULL OR e.company_id = $1::uuid)
       AND (
         $2::boolean = TRUE
         OR e.id = $3::uuid
         OR e.manager_id = $3::uuid
       )
     ORDER BY e.first_name, e.last_name
     LIMIT 250`,
    companyFilter,
    access.hasHrView,
    actorEmployee?.id || null,
  );
  return rows;
}

async function optionalQuery<T>(
  source: string,
  unavailableSources: string[],
  query: () => Promise<T[]>,
) {
  try {
    return await query();
  } catch (error) {
    console.warn(`[Performance] ${source} unavailable:`, error);
    unavailableSources.push(source);
    return [];
  }
}

function sanitizeFeedback(
  rows: Array<Record<string, unknown>>,
  selectedEmployeeId: string,
  access: Awaited<ReturnType<typeof buildAccessContext>>,
): Array<Record<string, unknown>> {
  return rows.flatMap(row => {
    const anonymous = Boolean(row.isAnonymous);
    const isRecipient = row.recipientId === selectedEmployeeId;
    const isManager = access.actorEmployee?.id === row.managerId;
    const canRead = access.hasHrView
      || (row.visibility === 'recipient' && isRecipient)
      || (row.visibility === 'manager' && isManager);
    if (!canRead) return [];
    return [{
      ...row,
      providerId: anonymous ? null : row.providerId,
      providerName: anonymous ? 'Anonymous feedback' : row.providerName,
    }];
  });
}

function createAlerts(input: {
  goals: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  checkIns: Array<Record<string, unknown>>;
  developmentActions: Array<Record<string, unknown>>;
}) {
  const now = Date.now();
  const alerts: PerformanceAlert[] = [];
  for (const review of input.reviews) {
    if (['not_started', 'in_progress', 'returned_for_revision'].includes(String(review.status))) {
      const dueDate = review.cycleEndDate ? String(review.cycleEndDate) : null;
      if (dueDate && new Date(dueDate).getTime() < now) {
        alerts.push({
          id: `review-${review.id}`,
          severity: 'critical',
          reason: 'Self-assessment overdue',
          requiredAction: 'Open the formal review and submit the required assessment.',
          owner: 'Employee',
          dueDate,
          relatedRecord: 'Appraisal',
          href: '/ess/performance',
          resolutionStatus: 'open',
        });
      }
    }
  }
  for (const goal of input.goals) {
    const dueDate = goal.dueDate ? String(goal.dueDate) : null;
    const overdue = dueDate && new Date(dueDate).getTime() < now && Number(goal.progress || 0) < 100;
    const stale = goal.updatedAt && now - new Date(String(goal.updatedAt)).getTime() > 30 * 86400000;
    if (overdue || stale) {
      alerts.push({
        id: `goal-${goal.id}`,
        severity: overdue ? 'critical' : 'warning',
        reason: overdue ? 'Goal overdue' : 'Goal progress not updated',
        requiredAction: 'Open Goal to review the source record and update progress.',
        owner: 'Employee',
        dueDate,
        relatedRecord: 'Goal',
        href: '/ess/performance',
        resolutionStatus: 'open',
      });
    }
  }
  for (const checkIn of input.checkIns) {
    const dueDate = checkIn.dueDate || checkIn.meetingDate;
    if (dueDate && new Date(String(dueDate)).getTime() < now && !['completed', 'cancelled'].includes(String(checkIn.status))) {
      alerts.push({
        id: `check-in-${checkIn.id}`,
        severity: 'warning',
        reason: 'Check-in overdue',
        requiredAction: 'Complete or reschedule the check-in.',
        owner: 'Employee and manager',
        dueDate: String(dueDate),
        relatedRecord: 'Check-in',
        href: '/workforce/performance?tab=check-ins',
        resolutionStatus: 'open',
      });
    }
  }
  for (const action of input.developmentActions) {
    if (action.dueDate && new Date(String(action.dueDate)).getTime() < now && !['completed', 'cancelled'].includes(String(action.status))) {
      alerts.push({
        id: `development-${action.id}`,
        severity: 'warning',
        reason: 'Development action overdue',
        requiredAction: 'Update the action progress or agree on a new date.',
        owner: 'Employee',
        dueDate: String(action.dueDate),
        relatedRecord: 'Development action',
        href: '/workforce/performance?tab=development',
        resolutionStatus: 'open',
      });
    }
  }
  return alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));
}

function buildActivities(input: {
  activities: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  checkIns: Array<Record<string, unknown>>;
  feedback: Array<Record<string, unknown>>;
  recognition: Array<Record<string, unknown>>;
}) {
  const derived = [
    ...input.reviews.map(row => ({
      id: `review-${row.id}`,
      activityType: 'appraisal',
      title: `Appraisal ${String(row.status || 'updated').replace(/_/g, ' ')}`,
      occurredAt: row.updatedAt,
      source: 'Appraisal',
    })),
    ...input.goals.map(row => ({
      id: `goal-${row.id}`,
      activityType: 'goal',
      title: `Goal updated: ${row.title}`,
      occurredAt: row.updatedAt,
      source: 'Goal',
    })),
    ...input.checkIns.map(row => ({
      id: `check-in-${row.id}`,
      activityType: 'check_in',
      title: `${String(row.type || 'check-in').replace(/_/g, ' ')} ${row.status}`,
      occurredAt: row.updatedAt || row.meetingDate,
      source: 'Performance',
    })),
    ...input.feedback.filter(row => row.status === 'published').map(row => ({
      id: `feedback-${row.id}`,
      activityType: 'feedback',
      title: `${String(row.feedbackType || 'performance').replace(/_/g, ' ')} feedback received`,
      occurredAt: row.createdAt,
      source: 'Performance',
    })),
    ...input.recognition.map(row => ({
      id: `recognition-${row.id}`,
      activityType: 'recognition',
      title: `Recognition: ${String(row.category || '').replace(/_/g, ' ')}`,
      occurredAt: row.createdAt,
      source: 'Performance',
    })),
  ];
  return [...input.activities, ...derived]
    .filter(item => item.occurredAt)
    .sort((a, b) => new Date(String(b.occurredAt)).getTime() - new Date(String(a.occurredAt)).getTime())
    .slice(0, 60);
}

export async function getPerformanceWorkspace(input: {
  user: SessionUser;
  selectedEmployeeId?: string | null;
}): Promise<PerformanceWorkspaceData> {
  const access = await buildAccessContext(input.user);
  const accessibleEmployees = await listAccessibleEmployees(access.actorEmployee, access);
  const selected = accessibleEmployees.find(employee => employee.id === input.selectedEmployeeId)
    || accessibleEmployees.find(employee => employee.id === access.actorEmployee?.id)
    || accessibleEmployees[0]
    || null;
  const selectedEmployeeId = selected?.id || null;
  const unavailableSources: string[] = [];

  if (!selectedEmployeeId) {
    return {
      permissions: access.permissions,
      selectedEmployee: null,
      employees: [],
      cycles: [],
      reviews: [],
      goals: [],
      checkIns: [],
      feedback: [],
      recognition: [],
      competencyEvidence: [],
      developmentPlans: [],
      developmentActions: [],
      activities: [],
      alerts: [],
      team: [],
      insights: { facts: [], calculated: [], recommendations: [] },
      meta: { generatedAt: new Date().toISOString(), partial: false, unavailableSources: [] },
    };
  }

  const canViewSelectedManagerNotes = canViewManagerPrivateNotes({
    hasHrView: access.hasHrView,
    actorEmployeeId: access.actorEmployee?.id,
    targetManagerId: selected.managerId,
  });
  const resolvedPermissions = {
    ...access.permissions,
    canViewPrivateManagerNotes: canViewSelectedManagerNotes,
  };
  const managerPrivateExpression = canViewSelectedManagerNotes
    ? 'ci.manager_private_notes'
    : 'NULL::text';
  const employeeDraftExpression = access.actorEmployee?.id === selectedEmployeeId
    ? 'ci.employee_draft_notes'
    : 'NULL::text';

  const [
    cycles,
    reviews,
    goals,
    checkIns,
    rawFeedback,
    recognition,
    competencyEvidence,
    developmentPlans,
    developmentActions,
    activities,
    team,
  ] = await Promise.all([
    optionalQuery('appraisal cycles', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, name, start_date AS "startDate", end_date AS "endDate", status
       FROM "hr_performance_cycles"
       WHERE status <> 'archived'
       ORDER BY start_date DESC
       LIMIT 20`,
    )),
    optionalQuery('appraisal reviews', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT pr.id, pr.status,
              CASE WHEN pr.status IN ('completed', 'acknowledged', 'released') THEN pr.rating ELSE NULL END AS rating,
              pr.summary, pr.self_assessment AS "selfAssessment",
              pr.competency_assessment AS "competencyAssessment",
              pr.employee_comments AS "employeeComments",
              CASE
                WHEN $2::boolean OR pr.status IN ('completed', 'acknowledged', 'released')
                THEN pr.manager_assessment
                ELSE NULL
              END AS "managerAssessment",
              pr.development_plan AS "developmentPlan",
              pr.completed_at AS "completedAt", pr.updated_at AS "updatedAt",
              pc.id AS "cycleId", pc.name AS "cycleName",
              pc.start_date AS "cycleStartDate", pc.end_date AS "cycleEndDate"
       FROM "hr_performance_reviews" pr
       JOIN "hr_performance_cycles" pc ON pc.id = pr.cycle_id
       WHERE pr.employee_id = $1::uuid
       ORDER BY pc.start_date DESC`,
      selectedEmployeeId,
      access.hasHrView || selected.managerId === access.actorEmployee?.id,
    )),
    optionalQuery('goals', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, title, description, status, progress, due_date AS "dueDate",
              key_results AS "keyResults", approval_status AS "approvalStatus",
              updated_at AS "updatedAt", version
       FROM "hr_performance_goals"
       WHERE employee_id = $1::uuid AND status <> 'archived'
       ORDER BY updated_at DESC`,
      selectedEmployeeId,
    )),
    optionalQuery('check-ins', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT ci.id, ci.employee_id AS "employeeId", ci.manager_id AS "managerId",
              ci.type, ci.meeting_date AS "meetingDate", ci.due_date AS "dueDate",
              ci.status, ci.agenda, ci.shared_notes AS "sharedNotes",
              ${employeeDraftExpression} AS "employeeDraftNotes",
              ${managerPrivateExpression} AS "managerPrivateNotes",
              ci.achievements, ci.challenges, ci.support_required AS "supportRequired",
              ci.follow_up_items AS "followUpItems", ci.recurring_rule AS "recurringRule",
              ci.completed_at AS "completedAt", ci.updated_at AS "updatedAt", ci.version,
              CONCAT_WS(' ', manager.preferred_name, manager.last_name) AS "managerName"
       FROM "hr_performance_check_ins" ci
       LEFT JOIN "hr_employees" manager ON manager.id = ci.manager_id
       WHERE ci.employee_id = $1::uuid
       ORDER BY ci.meeting_date DESC
       LIMIT 100`,
      selectedEmployeeId,
    )),
    optionalQuery('feedback', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT pf.id, pf.recipient_id AS "recipientId", pf.provider_id AS "providerId",
              pf.requested_provider_id AS "requestedProviderId",
              pf.feedback_type AS "feedbackType", pf.relationship, pf.visibility,
              pf.status, pf.related_project AS "relatedProject",
              pf.related_goal_id AS "relatedGoalId",
              pf.related_competency AS "relatedCompetency",
              pf.context, pf.went_well AS "wentWell",
              pf.improvement_suggestion AS "improvementSuggestion",
              pf.recommended_action AS "recommendedAction",
              pf.is_anonymous AS "isAnonymous", pf.created_at AS "createdAt",
              CONCAT_WS(' ', provider.preferred_name, provider.last_name) AS "providerName",
              recipient.manager_id AS "managerId"
       FROM "hr_performance_feedback" pf
       JOIN "hr_employees" recipient ON recipient.id = pf.recipient_id
       LEFT JOIN "hr_employees" provider ON provider.id = pf.provider_id
       WHERE pf.recipient_id = $1::uuid
          OR pf.provider_id = $2::uuid
          OR pf.requested_provider_id = $2::uuid
       ORDER BY pf.created_at DESC
       LIMIT 100`,
      selectedEmployeeId,
      access.actorEmployee?.id || null,
    )),
    optionalQuery('recognition', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT r.id, r.recipient_id AS "recipientId", r.provider_id AS "providerId",
              r.category, r.message, r.company_value AS "companyValue",
              r.competency, r.related_project AS "relatedProject",
              r.visibility, r.created_at AS "createdAt",
              CONCAT_WS(' ', provider.preferred_name, provider.last_name) AS "providerName"
       FROM "hr_employee_recognition" r
       LEFT JOIN "hr_employees" provider ON provider.id = r.provider_id
       WHERE r.recipient_id = $1::uuid
       ORDER BY r.created_at DESC
       LIMIT 50`,
      selectedEmployeeId,
    )),
    optionalQuery('competency evidence', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, competency_name AS "competencyName", evidence_type AS "evidenceType",
              title, description, evidence_url AS "evidenceUrl", status,
              validated_at AS "validatedAt", created_at AS "createdAt"
       FROM "hr_competency_evidence"
       WHERE employee_id = $1::uuid
       ORDER BY created_at DESC`,
      selectedEmployeeId,
    )),
    optionalQuery('development plans', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, employee_id AS "employeeId", owner_manager_id AS "ownerManagerId",
              title, plan_type AS "planType", status, aspiration,
              target_date AS "targetDate", employee_comments AS "employeeComments",
              CASE WHEN $2::boolean THEN manager_comments ELSE NULL END AS "managerComments",
              version, approved_at AS "approvedAt", completed_at AS "completedAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM "hr_development_plans"
       WHERE employee_id = $1::uuid
       ORDER BY updated_at DESC`,
      selectedEmployeeId,
      canViewSelectedManagerNotes,
    )),
    optionalQuery('development actions', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT da.id, da.plan_id AS "planId", da.title, da.description,
              da.action_type AS "actionType", da.related_competency AS "relatedCompetency",
              da.learning_course_id AS "learningCourseId", da.priority, da.status,
              da.progress, da.due_date AS "dueDate", da.evidence,
              da.employee_comments AS "employeeComments",
              CASE WHEN $2::boolean THEN da.manager_comments ELSE NULL END AS "managerComments",
              da.version, da.completed_at AS "completedAt",
              lc.title AS "learningCourseTitle"
       FROM "hr_development_actions" da
       JOIN "hr_development_plans" dp ON dp.id = da.plan_id
       LEFT JOIN "hr_learning_courses" lc ON lc.id = da.learning_course_id
       WHERE dp.employee_id = $1::uuid
       ORDER BY da.due_date ASC NULLS LAST, da.created_at DESC`,
      selectedEmployeeId,
      canViewSelectedManagerNotes,
    )),
    optionalQuery('performance activity', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, activity_type AS "activityType", entity_type AS "entityType",
              entity_id AS "entityId", title, details, visibility,
              occurred_at AS "occurredAt", 'Performance' AS source
       FROM "hr_performance_activities"
       WHERE employee_id = $1::uuid
         AND ($2::boolean OR visibility IN ('employee', 'shared'))
       ORDER BY occurred_at DESC
       LIMIT 100`,
      selectedEmployeeId,
      access.hasHrView,
    )),
    access.permissions.canViewTeam
      ? optionalQuery('team performance', unavailableSources, () => prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT e.id,
                CONCAT_WS(' ', COALESCE(e.preferred_name, e.first_name), e.last_name) AS name,
                e.employee_number AS "employeeNumber", e.job_title AS "jobTitle",
                COALESCE(d.name, e.business_unit) AS department, e.location,
                e.profile_photo_url AS "profilePhotoUrl",
                latest_review.status AS "reviewStatus",
                CASE WHEN latest_review.status IN ('completed', 'acknowledged', 'released') THEN latest_review.rating ELSE NULL END AS rating,
                COALESCE(goal_summary.goal_progress, 0)::int AS "goalProgress",
                COALESCE(goal_summary.at_risk_goals, 0)::int AS "atRiskGoals",
                COALESCE(check_in_summary.overdue_check_ins, 0)::int AS "overdueCheckIns",
                COALESCE(development_summary.overdue_actions, 0)::int AS "overdueDevelopmentActions",
                COALESCE(development_summary.development_progress, 0)::int AS "developmentProgress"
         FROM "hr_employees" e
         LEFT JOIN "hr_departments" d ON d.id = e.department_id
         LEFT JOIN LATERAL (
           SELECT pr.status, pr.rating
           FROM "hr_performance_reviews" pr
           JOIN "hr_performance_cycles" pc ON pc.id = pr.cycle_id
           WHERE pr.employee_id = e.id
           ORDER BY pc.start_date DESC
           LIMIT 1
         ) latest_review ON TRUE
         LEFT JOIN LATERAL (
           SELECT ROUND(AVG(pg.progress)) AS goal_progress,
                  COUNT(*) FILTER (WHERE pg.due_date < CURRENT_TIMESTAMP AND pg.progress < 100) AS at_risk_goals
           FROM "hr_performance_goals" pg
           WHERE pg.employee_id = e.id AND pg.status NOT IN ('cancelled', 'archived')
         ) goal_summary ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*) FILTER (
             WHERE COALESCE(ci.due_date, ci.meeting_date) < CURRENT_TIMESTAMP
               AND ci.status NOT IN ('completed', 'cancelled')
           ) AS overdue_check_ins
           FROM "hr_performance_check_ins" ci
           WHERE ci.employee_id = e.id
         ) check_in_summary ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*) FILTER (
                    WHERE da.due_date < CURRENT_TIMESTAMP AND da.status NOT IN ('completed', 'cancelled')
                  ) AS overdue_actions,
                  ROUND(AVG(da.progress)) AS development_progress
           FROM "hr_development_plans" dp
           LEFT JOIN "hr_development_actions" da ON da.plan_id = dp.id
           WHERE dp.employee_id = e.id
         ) development_summary ON TRUE
         WHERE e.status IN ('active', 'probation', 'onboarding')
           AND ($1::boolean OR e.manager_id = $2::uuid)
           AND ($3::uuid IS NULL OR e.company_id IS NULL OR e.company_id = $3::uuid)
         ORDER BY "atRiskGoals" DESC, "overdueCheckIns" DESC, name
         LIMIT 250`,
        access.hasHrView,
        access.actorEmployee?.id || null,
        access.actorEmployee?.companyId || null,
      ))
      : Promise.resolve([]),
  ]);

  const feedback = sanitizeFeedback(rawFeedback, selectedEmployeeId, access);
  for (const row of reviews) {
    if (!shouldRevealRating(row.status, resolvedPermissions.canViewRatings)) row.rating = null;
  }
  for (const row of team) {
    row.performanceStatus = toPerformanceStatus({
      reviewStatus: row.reviewStatus,
      overdueActions: Number(row.overdueCheckIns || 0) + Number(row.overdueDevelopmentActions || 0),
      atRiskGoals: Number(row.atRiskGoals || 0),
    });
  }
  const alerts = createAlerts({ goals, reviews, checkIns, developmentActions });
  const timeline = buildActivities({ activities, reviews, goals, checkIns, feedback, recognition });
  const activeGoals = goals.filter(goal => !['completed', 'cancelled', 'archived'].includes(String(goal.status)));
  const goalProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / activeGoals.length)
    : 0;
  const completedCheckIns = checkIns.filter(checkIn => checkIn.status === 'completed').length;
  const activeActions = developmentActions.filter(action => !['completed', 'cancelled'].includes(String(action.status)));
  const developmentProgress = activeActions.length
    ? Math.round(activeActions.reduce((sum, action) => sum + Number(action.progress || 0), 0) / activeActions.length)
    : 0;
  const competencies = reviews[0]?.competencyAssessment;
  const competencyGapCount = competencies && typeof competencies === 'object'
    ? Object.values(competencies as Record<string, unknown>).filter(value => {
      if (!value || typeof value !== 'object') return false;
      const rating = value as Record<string, unknown>;
      return Number(rating.currentLevel || rating.managerRating || 0) < Number(rating.expectedLevel || 0);
    }).length
    : 0;

  return {
    permissions: resolvedPermissions,
    selectedEmployee: toEmployeeSummary(selected),
    employees: accessibleEmployees.map(toEmployeeSummary),
    cycles,
    reviews,
    goals,
    checkIns,
    feedback,
    recognition,
    competencyEvidence,
    developmentPlans,
    developmentActions,
    activities: timeline,
    alerts,
    team,
    insights: {
      facts: [
        { label: 'Active goals', value: activeGoals.length, description: 'Recorded in Goal' },
        { label: 'Completed check-ins', value: completedCheckIns, description: 'Recorded performance meetings' },
        { label: 'Feedback received', value: feedback.filter(item => item.status === 'published').length, description: 'Visible feedback records' },
        { label: 'Recognition received', value: recognition.length, description: 'Recognition records' },
      ],
      calculated: [
        { label: 'Average goal progress', value: `${goalProgress}%`, description: 'Mean progress across active Goal records' },
        { label: 'Development progress', value: `${developmentProgress}%`, description: 'Mean progress across open development actions' },
        { label: 'Open performance alerts', value: alerts.length, description: 'Rule-based overdue or stale records' },
        { label: 'Competency gaps', value: competencyGapCount, description: 'Current level below expected level in the latest released assessment' },
      ],
      recommendations: competencyGapCount > 0
        ? [{ label: 'Review targeted learning', reason: `${competencyGapCount} competency gap${competencyGapCount === 1 ? '' : 's'} recorded in the latest assessment.`, href: '/learning' }]
        : [],
    },
    meta: {
      generatedAt: new Date().toISOString(),
      partial: unavailableSources.length > 0,
      unavailableSources,
    },
  };
}

async function findEmployeeById(employeeId: string) {
  const rows = await prisma.$queryRawUnsafe<EmployeeRow[]>(
    `SELECT e.id, e.user_id AS "userId", e.employee_number AS "employeeNumber",
            e.first_name AS "firstName", e.last_name AS "lastName",
            e.preferred_name AS "preferredName", e.email, e.job_title AS "jobTitle",
            e.business_unit AS department, e.location, e.manager_id AS "managerId",
            NULL::text AS "managerName", e.profile_photo_url AS "profilePhotoUrl",
            e.company_id AS "companyId"
     FROM "hr_employees" e WHERE e.id = $1::uuid LIMIT 1`,
    employeeId,
  );
  return rows[0] || null;
}

function sameCompany(actor: EmployeeRow | null, target: EmployeeRow) {
  return !actor?.companyId || !target.companyId || actor.companyId === target.companyId;
}

function canActOnEmployee(
  actor: EmployeeRow | null,
  target: EmployeeRow,
  access: Awaited<ReturnType<typeof buildAccessContext>>,
) {
  return access.hasHrView
    || actor?.id === target.id
    || (actor?.id && target.managerId === actor.id);
}

async function createActivity(input: {
  employeeId: string;
  actorUserId: string;
  activityType: string;
  entityType: string;
  entityId: string;
  title: string;
  details?: Record<string, unknown>;
  visibility?: string;
  idempotencyKey?: string;
}) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "hr_performance_activities"
      ("id", "employee_id", "actor_user_id", "activity_type", "entity_type",
       "entity_id", "title", "details", "visibility", "idempotency_key",
       "occurred_at", "created_at")
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::uuid, $7, $8::jsonb, $9, $10,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("idempotency_key") DO NOTHING`,
    randomUUID(),
    input.employeeId,
    input.actorUserId,
    input.activityType,
    input.entityType,
    input.entityId,
    input.title,
    JSON.stringify(input.details || {}),
    input.visibility || 'employee',
    input.idempotencyKey ? `activity:${input.idempotencyKey}` : null,
  );
}

async function notifyEmployee(
  employee: EmployeeRow,
  actorUserId: string,
  notification: { type: string; title: string; message: string; href: string; recordId: string },
) {
  if (!employee.userId || employee.userId === actorUserId) return;
  await NotificationService.createNotification(employee.userId, {
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: { href: notification.href, recordId: notification.recordId },
  }, actorUserId).catch(() => null);
}

export async function mutatePerformanceWorkspace(user: SessionUser, mutation: PerformanceMutation) {
  const access = await buildAccessContext(user);
  const actor = access.actorEmployee;
  if (!actor && !access.hasHrView) throw new Error('No employee record is linked to this account.');

  if (mutation.action === 'give_feedback' || mutation.action === 'recognize') {
    const target = await findEmployeeById(mutation.recipientId);
    if (!target || !sameCompany(actor, target)) throw new Error('The employee is outside your authorized company scope.');
    if (mutation.action === 'give_feedback') {
      if (mutation.isAnonymous && process.env.PERFORMANCE_ANONYMOUS_FEEDBACK_ENABLED !== 'true') {
        throw new Error('Anonymous feedback is not enabled by policy.');
      }
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `INSERT INTO "hr_performance_feedback"
          ("id", "recipient_id", "provider_id", "feedback_type", "relationship",
           "visibility", "status", "related_project", "related_goal_id",
           "related_competency", "context", "went_well", "improvement_suggestion",
           "recommended_action", "is_anonymous", "idempotency_key",
           "created_at", "updated_at")
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, 'published', $7,
                 $8::uuid, $9, $10, $11, $12, $13, $14, $15,
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_performance_feedback"."id"
         RETURNING *`,
        randomUUID(),
        target.id,
        actor?.id || null,
        mutation.feedbackType,
        mutation.relationship || null,
        mutation.visibility,
        mutation.relatedProject || null,
        mutation.relatedGoalId || null,
        mutation.relatedCompetency || null,
        mutation.context,
        mutation.wentWell || null,
        mutation.improvementSuggestion || null,
        mutation.recommendedAction || null,
        mutation.isAnonymous,
        mutation.idempotencyKey,
      );
      const row = rows[0];
      await createActivity({
        employeeId: target.id,
        actorUserId: user.id,
        activityType: 'feedback',
        entityType: 'performance_feedback',
        entityId: String(row.id),
        title: `${mutation.feedbackType.replace(/_/g, ' ')} feedback received`,
        idempotencyKey: mutation.idempotencyKey,
      });
      await notifyEmployee(target, user.id, {
        type: 'performance_feedback_received',
        title: 'New performance feedback',
        message: 'New feedback is available in your Performance workspace.',
        href: '/workforce/performance?tab=feedback',
        recordId: String(row.id),
      });
      return row;
    }

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_employee_recognition"
        ("id", "recipient_id", "provider_id", "category", "message",
         "company_value", "competency", "related_project", "visibility",
         "idempotency_key", "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_employee_recognition"."id"
       RETURNING *`,
      randomUUID(),
      target.id,
      actor?.id || null,
      mutation.category,
      mutation.message,
      mutation.companyValue || null,
      mutation.competency || null,
      mutation.relatedProject || null,
      mutation.visibility,
      mutation.idempotencyKey,
    );
    const row = rows[0];
    await createActivity({
      employeeId: target.id,
      actorUserId: user.id,
      activityType: 'recognition',
      entityType: 'employee_recognition',
      entityId: String(row.id),
      title: `Recognition: ${mutation.category.replace(/_/g, ' ')}`,
      idempotencyKey: mutation.idempotencyKey,
    });
    await notifyEmployee(target, user.id, {
      type: 'performance_recognition_received',
      title: 'You received recognition',
      message: mutation.message.slice(0, 180),
      href: '/workforce/performance?tab=feedback',
      recordId: String(row.id),
    });
    return row;
  }

  if (mutation.action === 'request_feedback') {
    if (!actor) throw new Error('An employee record is required to request feedback.');
    const requestedProvider = await findEmployeeById(mutation.requestedProviderId);
    if (!requestedProvider || !sameCompany(actor, requestedProvider)) throw new Error('The selected provider is outside your authorized company scope.');
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_performance_feedback"
        ("id", "recipient_id", "provider_id", "requested_provider_id",
         "feedback_type", "visibility", "status", "related_project",
         "related_competency", "context", "idempotency_key",
         "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, NULL, $3::uuid, 'peer', 'recipient',
               'requested', $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_performance_feedback"."id"
       RETURNING *`,
      randomUUID(),
      actor.id,
      requestedProvider.id,
      mutation.relatedProject || null,
      mutation.relatedCompetency || null,
      mutation.context,
      mutation.idempotencyKey,
    );
    const row = rows[0];
    await notifyEmployee(requestedProvider, user.id, {
      type: 'performance_feedback_requested',
      title: 'Feedback requested',
      message: `${employeeName(actor)} requested your feedback.`,
      href: '/workforce/performance?tab=feedback',
      recordId: String(row.id),
    });
    return row;
  }

  const employeeId = 'employeeId' in mutation ? mutation.employeeId : null;
  const target = employeeId ? await findEmployeeById(employeeId) : null;
  if (employeeId && (!target || !canActOnEmployee(actor, target, access))) {
    throw new Error('You do not have access to this employee performance record.');
  }

  if (mutation.action === 'create_check_in') {
    const canWriteManagerPrivateNotes = canViewManagerPrivateNotes({
      hasHrView: access.hasHrView,
      actorEmployeeId: actor?.id,
      targetManagerId: target?.managerId,
    });
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_performance_check_ins"
        ("id", "employee_id", "manager_id", "created_by_id", "type",
         "meeting_date", "due_date", "status", "agenda", "shared_notes",
         "employee_draft_notes", "manager_private_notes", "recurring_rule",
         "idempotency_key", "version", "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6::timestamp,
               $6::timestamp, 'scheduled', $7, $8, $9, $10, $11, $12, 1,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_performance_check_ins"."id"
       RETURNING *`,
      randomUUID(),
      mutation.employeeId,
      target?.managerId || (actor?.id !== mutation.employeeId ? actor?.id : null),
      user.id,
      mutation.type,
      mutation.meetingDate,
      mutation.agenda,
      mutation.sharedNotes || null,
      actor?.id === mutation.employeeId ? mutation.employeeDraftNotes || null : null,
      canWriteManagerPrivateNotes ? mutation.managerPrivateNotes || null : null,
      mutation.recurringRule || null,
      mutation.idempotencyKey,
    );
    const row = rows[0];
    await createActivity({
      employeeId: mutation.employeeId,
      actorUserId: user.id,
      activityType: 'check_in_scheduled',
      entityType: 'performance_check_in',
      entityId: String(row.id),
      title: `${mutation.type.replace(/_/g, ' ')} scheduled`,
      idempotencyKey: mutation.idempotencyKey,
    });
    if (target) {
      await notifyEmployee(target, user.id, {
        type: 'performance_check_in_scheduled',
        title: 'Performance check-in scheduled',
        message: `A ${mutation.type.replace(/_/g, ' ')} has been scheduled.`,
        href: '/workforce/performance?tab=check-ins',
        recordId: String(row.id),
      });
    }
    return row;
  }

  if (mutation.action === 'complete_check_in') {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `UPDATE "hr_performance_check_ins"
       SET status = 'completed', shared_notes = COALESCE($4, shared_notes),
           achievements = $5, challenges = $6, support_required = $7,
           follow_up_items = $8::jsonb, completed_at = CURRENT_TIMESTAMP,
           version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND employee_id = $2::uuid AND version = $3
         AND status NOT IN ('completed', 'cancelled')
       RETURNING *`,
      mutation.id,
      mutation.employeeId,
      mutation.expectedVersion,
      mutation.sharedNotes || null,
      mutation.achievements || null,
      mutation.challenges || null,
      mutation.supportRequired || null,
      JSON.stringify(mutation.followUpItems),
    );
    if (!rows[0]) throw new Error('This check-in changed before your update. Refresh and try again.');
    await createActivity({
      employeeId: mutation.employeeId,
      actorUserId: user.id,
      activityType: 'check_in_completed',
      entityType: 'performance_check_in',
      entityId: mutation.id,
      title: 'Performance check-in completed',
    });
    return rows[0];
  }

  if (mutation.action === 'submit_competency_evidence') {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_competency_evidence"
        ("id", "employee_id", "competency_name", "evidence_type", "title",
         "description", "evidence_url", "status", "idempotency_key",
         "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, 'submitted', $8,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_competency_evidence"."id"
       RETURNING *`,
      randomUUID(),
      mutation.employeeId,
      mutation.competencyName,
      mutation.evidenceType,
      mutation.title,
      mutation.description || null,
      mutation.evidenceUrl || null,
      mutation.idempotencyKey,
    );
    const row = rows[0];
    await createActivity({
      employeeId: mutation.employeeId,
      actorUserId: user.id,
      activityType: 'competency_evidence_submitted',
      entityType: 'competency_evidence',
      entityId: String(row.id),
      title: `Evidence submitted for ${mutation.competencyName}`,
      idempotencyKey: mutation.idempotencyKey,
    });
    return row;
  }

  if (mutation.action === 'create_development_plan') {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_development_plans"
        ("id", "employee_id", "owner_manager_id", "title", "plan_type",
         "status", "aspiration", "target_date", "idempotency_key", "version",
         "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'proposed', $6,
               $7::timestamp, $8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_development_plans"."id"
       RETURNING *`,
      randomUUID(),
      mutation.employeeId,
      target?.managerId || null,
      mutation.title,
      mutation.planType,
      mutation.aspiration || null,
      mutation.targetDate || null,
      mutation.idempotencyKey,
    );
    const row = rows[0];
    await createActivity({
      employeeId: mutation.employeeId,
      actorUserId: user.id,
      activityType: 'development_plan_proposed',
      entityType: 'development_plan',
      entityId: String(row.id),
      title: `Development plan proposed: ${mutation.title}`,
      idempotencyKey: mutation.idempotencyKey,
    });
    if (target) {
      await notifyEmployee(target, user.id, {
        type: 'performance_development_plan_proposed',
        title: 'Development plan proposed',
        message: mutation.title,
        href: '/workforce/performance?tab=development',
        recordId: String(row.id),
      });
    }
    return row;
  }

  if (mutation.action === 'add_development_action') {
    const planRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "hr_development_plans" WHERE id = $1::uuid AND employee_id = $2::uuid LIMIT 1`,
      mutation.planId,
      mutation.employeeId,
    );
    if (!planRows[0]) throw new Error('Development plan not found.');
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `INSERT INTO "hr_development_actions"
        ("id", "plan_id", "title", "description", "action_type",
         "related_competency", "learning_course_id", "priority", "status",
         "progress", "due_date", "idempotency_key", "version",
         "created_at", "updated_at")
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, $8,
               'proposed', 0, $9::timestamp, $10, 1,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("idempotency_key") DO UPDATE SET "id" = "hr_development_actions"."id"
       RETURNING *`,
      randomUUID(),
      mutation.planId,
      mutation.title,
      mutation.description || null,
      mutation.actionType,
      mutation.relatedCompetency || null,
      mutation.learningCourseId || null,
      mutation.priority,
      mutation.dueDate || null,
      mutation.idempotencyKey,
    );
    return rows[0];
  }

  if (mutation.action === 'update_development_action') {
    const canWriteManagerComments = canViewManagerPrivateNotes({
      hasHrView: access.hasHrView,
      actorEmployeeId: actor?.id,
      targetManagerId: target?.managerId,
    });
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `UPDATE "hr_development_actions" da
       SET progress = $4, status = $5,
           employee_comments = CASE WHEN $6::text IS NULL THEN employee_comments ELSE $6 END,
           manager_comments = CASE WHEN $7::text IS NULL THEN manager_comments ELSE $7 END,
           completed_at = CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
           version = da.version + 1, updated_at = CURRENT_TIMESTAMP
       FROM "hr_development_plans" dp
       WHERE da.id = $1::uuid AND da.plan_id = dp.id
         AND dp.employee_id = $2::uuid AND da.version = $3
       RETURNING da.*`,
      mutation.id,
      mutation.employeeId,
      mutation.expectedVersion,
      mutation.progress,
      mutation.status,
      mutation.employeeComments || null,
      canWriteManagerComments ? mutation.managerComments || null : null,
    );
    if (!rows[0]) throw new Error('This development action changed before your update. Refresh and try again.');
    return rows[0];
  }

  throw new Error('Unsupported performance action.');
}
