import { getPool } from '@/lib/db';
import { hasAnyPermission, isAdminUser, type SessionLikeUser } from '@/lib/permissions';

export interface LearningCapabilities {
  canUseLearningSelfService: boolean;
  canViewLearningManagement: boolean;
  canManageLearning: boolean;
  canReviewAssignments: boolean;
  canOverrideCompletion: boolean;
  canViewReports: boolean;
}

export interface LearningSessionUser extends SessionLikeUser {
  id: string;
  email?: string | null;
}

export interface LearningEmployeeIdentity {
  id: string;
  companyId: string | null;
}

export interface LearningActorContext {
  userId: string;
  employeeId: string | null;
  companyId: string | null;
  isAdmin: boolean;
  capabilities: LearningCapabilities;
}

interface EmployeeQueryExecutor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}

export function getLearningCapabilities(
  user: SessionLikeUser | null | undefined,
  employeeId: string | null,
): LearningCapabilities {
  const canManageLearning = hasAnyPermission(user, ['HR_LEARNING_MANAGE']);
  const canViewLearningManagement = hasAnyPermission(user, ['HR_LEARNING_VIEW', 'HR_LEARNING_MANAGE']);

  return {
    canUseLearningSelfService: Boolean(employeeId),
    canViewLearningManagement,
    canManageLearning,
    canReviewAssignments: canManageLearning,
    canOverrideCompletion: canManageLearning,
    canViewReports: canViewLearningManagement,
  };
}

export async function learningEmployeeForUser(
  userId: string,
  email?: string | null,
  executor?: EmployeeQueryExecutor,
): Promise<LearningEmployeeIdentity | null> {
  const sql = `SELECT id, company_id
    FROM hr_employees
    WHERE user_id = $1 OR (user_id IS NULL AND lower(email) = lower($2))
    ORDER BY user_id NULLS LAST
    LIMIT 1`;
  const values = [userId, email || ''];
  const result = executor
    ? await executor.query<{ id: string; company_id: string | null }>(sql, values)
    : await getPool().query<{ id: string; company_id: string | null }>(sql, values);
  const employee = result.rows[0];

  return employee ? { id: employee.id, companyId: employee.company_id ?? null } : null;
}

export async function employeeForUser(userId: string, email?: string | null) {
  return (await learningEmployeeForUser(userId, email))?.id ?? null;
}

export async function resolveLearningActor(user: LearningSessionUser): Promise<LearningActorContext> {
  const employee = await learningEmployeeForUser(user.id, user.email);

  return {
    userId: user.id,
    employeeId: employee?.id ?? null,
    companyId: employee?.companyId ?? null,
    isAdmin: isAdminUser(user),
    capabilities: getLearningCapabilities(user, employee?.id ?? null),
  };
}
