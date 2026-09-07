import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { completeBlock } from '@/lib/learning/learning-service';

export interface LearningManagementActor {
  userId: string;
  companyId: string | null;
  isAdmin: boolean;
}

export interface LearningReportFilters {
  employeeId?: string | null;
  courseId?: string | null;
  status?: string | null;
  dueFrom?: string | null;
  dueTo?: string | null;
  completedFrom?: string | null;
  completedTo?: string | null;
}

export interface LearningManagementDependencies {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
  completeBlock(input: { enrollmentId: string; lessonId: string; blockId: string; employeeId: string }): Promise<unknown>;
  audit?(message: string, userId: string, details: Record<string, unknown>): Promise<void>;
}

const defaultDependencies: LearningManagementDependencies = {
  query: (sql, values) => getPool().query(sql, values),
  completeBlock,
  audit: async (message, userId, details) => {
    await logAudit('AUDIT', message, 'Learning:Management', userId, details);
  },
};

export class LearningConflictError extends Error {
  constructor(message = 'This learning record changed while you were reviewing it. Reload and try again.') {
    super(message);
    this.name = 'LearningConflictError';
  }
}

function assertScope(actor: LearningManagementActor, companyId: string | null | undefined) {
  if (actor.isAdmin) return;
  if (!actor.companyId || companyId !== actor.companyId) throw new Error('Record is outside your company scope.');
}

function sameInstant(a: unknown, b: string) {
  const left = new Date(String(a)).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && Number.isFinite(right) && left === right;
}

export async function reviewLearningAssignment(
  input: { submissionId: string; approved: boolean; feedback?: string; expectedUpdatedAt: string; actor: LearningManagementActor },
  dependencies: LearningManagementDependencies = defaultDependencies,
) {
  const feedback = input.feedback?.trim() || null;
  if (!input.approved && !feedback) throw new Error('Feedback is required when requesting changes.');

  const found = await dependencies.query(
    `SELECT s.id,s.enrollment_id,s.block_id,s.updated_at,b.lesson_id,e.employee_id,emp.company_id
       FROM hr_learning_assignment_submissions s
       JOIN hr_learning_enrollments e ON e.id=s.enrollment_id
       JOIN hr_employees emp ON emp.id=e.employee_id
       JOIN hr_learning_content_blocks b ON b.id=s.block_id
       JOIN hr_learning_lessons l ON l.id=b.lesson_id
       JOIN hr_learning_course_sections sec ON sec.id=l.section_id AND sec.version_id=e.course_version_id
      WHERE s.id=$1::uuid AND b.type='assignment'
      LIMIT 1`,
    [input.submissionId],
  );
  const row = found.rows[0];
  if (!row) throw new Error('Assignment submission not found.');
  assertScope(input.actor, row.company_id == null ? null : String(row.company_id));
  if (!sameInstant(row.updated_at, input.expectedUpdatedAt)) throw new LearningConflictError();

  const updated = await dependencies.query(
    `UPDATE hr_learning_assignment_submissions
        SET status=$2,feedback=$3,reviewed_by=$4::uuid,reviewed_at=NOW(),updated_at=NOW()
      WHERE id=$1::uuid AND updated_at=$5::timestamptz
      RETURNING *`,
    [input.submissionId, input.approved ? 'approved' : 'changes_requested', feedback, input.actor.userId, input.expectedUpdatedAt],
  );
  if (!updated.rowCount) throw new LearningConflictError();

  if (input.approved) {
    await dependencies.completeBlock({
      enrollmentId: String(row.enrollment_id),
      lessonId: String(row.lesson_id),
      blockId: String(row.block_id),
      employeeId: String(row.employee_id),
    });
  }
  await dependencies.audit?.(
    input.approved ? 'Learning assignment approved.' : 'Learning assignment changes requested.',
    input.actor.userId,
    { submissionId: input.submissionId, feedback },
  );
  return updated.rows[0];
}

export async function overrideLearningCompletion(
  input: { enrollmentId: string; reason: string; actor: LearningManagementActor },
  dependencies: LearningManagementDependencies = defaultDependencies,
) {
  const reason = input.reason.trim();
  if (reason.length < 5) throw new Error('A completion override reason is required.');

  const found = await dependencies.query(
    `SELECT e.employee_id,emp.company_id
       FROM hr_learning_enrollments e
       JOIN hr_employees emp ON emp.id=e.employee_id
      WHERE e.id=$1::uuid LIMIT 1`,
    [input.enrollmentId],
  );
  if (!found.rows[0]) throw new Error('Enrollment not found.');
  assertScope(input.actor, found.rows[0].company_id == null ? null : String(found.rows[0].company_id));

  const updated = await dependencies.query(
    `UPDATE hr_learning_enrollments
        SET status='completed',progress=100,completed_at=COALESCE(completed_at,NOW()),updated_at=NOW()
      WHERE id=$1::uuid RETURNING *`,
    [input.enrollmentId],
  );
  await dependencies.query(
    `INSERT INTO hr_learning_activity_events(id,enrollment_id,type,metadata,actor_user_id,created_at)
     VALUES(gen_random_uuid(),$1::uuid,'admin_override',$2::jsonb,$3::uuid,NOW())`,
    [input.enrollmentId, { reason }, input.actor.userId],
  );
  await dependencies.audit?.('Learning completion overridden.', input.actor.userId, { enrollmentId: input.enrollmentId, reason });
  return updated.rows[0];
}

function reportWhere(actor: LearningManagementActor, filters: LearningReportFilters) {
  if (!actor.isAdmin && !actor.companyId) throw new Error('Learning management requires a company-scoped employee profile.');
  const values: unknown[] = [];
  const conditions: string[] = [];
  if (!actor.isAdmin) {
    values.push(actor.companyId);
    conditions.push(`emp.company_id=$${values.length}::uuid`);
  }
  const add = (value: unknown, sql: (index: number) => string) => {
    if (value == null || value === '') return;
    values.push(value);
    conditions.push(sql(values.length));
  };
  add(filters.employeeId, index => `e.employee_id=$${index}::uuid`);
  add(filters.courseId, index => `e.course_id=$${index}::uuid`);
  add(filters.status, index => `e.status=$${index}`);
  add(filters.dueFrom, index => `e.due_date>=$${index}::date`);
  add(filters.dueTo, index => `e.due_date<=$${index}::date`);
  add(filters.completedFrom, index => `e.completed_at>=$${index}::timestamptz`);
  add(filters.completedTo, index => `e.completed_at<=$${index}::timestamptz`);
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

export async function getLearningReport(
  actor: LearningManagementActor,
  filters: LearningReportFilters = {},
  dependencies: LearningManagementDependencies = defaultDependencies,
) {
  const scoped = reportWhere(actor, filters);
  const summaryResult = await dependencies.query(
    `SELECT count(*)::int assigned,
      count(*) FILTER(WHERE e.status='assigned')::int not_started,
      count(*) FILTER(WHERE e.status='in_progress')::int in_progress,
      count(*) FILTER(WHERE e.status='completed')::int completed,
      count(*) FILTER(WHERE e.due_date<NOW() AND e.status<>'completed')::int overdue,
      COALESCE(sum(e.active_seconds),0)::int active_seconds
     FROM hr_learning_enrollments e
     JOIN hr_employees emp ON emp.id=e.employee_id
     ${scoped.where}`,
    scoped.values,
  );
  const rowsResult = await dependencies.query(
    `SELECT e.id,e.employee_id,e.course_id,e.status,e.progress,e.due_date,e.completed_at,e.active_seconds,e.updated_at,
            c.title AS course_title,concat(emp.first_name,' ',emp.last_name) AS employee_name
       FROM hr_learning_enrollments e
       JOIN hr_learning_courses c ON c.id=e.course_id
       JOIN hr_employees emp ON emp.id=e.employee_id
       ${scoped.where}
      ORDER BY e.updated_at DESC LIMIT 1000`,
    scoped.values,
  );

  const submissionValues = [...scoped.values];
  const submissionWhere = scoped.where.replaceAll('e.', 'e.');
  const submissionsResult = await dependencies.query(
    `SELECT s.id,s.status,s.text,s.file_url,s.feedback,s.reviewed_at,s.updated_at,s.block_id,s.enrollment_id,
            c.title AS course_title,concat(emp.first_name,' ',emp.last_name) AS employee_name,b.title AS block_title
       FROM hr_learning_assignment_submissions s
       JOIN hr_learning_enrollments e ON e.id=s.enrollment_id
       JOIN hr_learning_courses c ON c.id=e.course_id
       JOIN hr_employees emp ON emp.id=e.employee_id
       JOIN hr_learning_content_blocks b ON b.id=s.block_id
       ${submissionWhere}
      ORDER BY s.updated_at DESC LIMIT 500`,
    submissionValues,
  );

  return { summary: summaryResult.rows[0] ?? {}, rows: rowsResult.rows, submissions: submissionsResult.rows };
}

export async function getLearningManagementOverview(
  actor: LearningManagementActor,
  dependencies: LearningManagementDependencies = defaultDependencies,
) {
  const report = await getLearningReport(actor, {}, dependencies);
  return { summary: report.summary, pendingReviews: report.submissions.filter(row => row.status === 'pending').slice(0, 25), recentEnrollments: report.rows.slice(0, 25) };
}
