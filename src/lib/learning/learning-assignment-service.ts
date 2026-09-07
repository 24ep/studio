import { getPool } from '@/lib/db';
import { NotificationService } from '@/lib/notificationService';

export type LearningAssignmentSourceType = 'course' | 'path' | 'manual';

export interface LearningAssignmentActor {
  userId: string;
  companyId: string | null;
  isAdmin: boolean;
}

export interface LearningAssignmentInput {
  employeeId: string;
  courseIds: string[];
  sourceType: LearningAssignmentSourceType;
  sourceId?: string | null;
  sourceLabel: string;
  dueDate?: string | null;
  idempotencyKey: string;
  actor: LearningAssignmentActor;
}

export interface LearningAssignmentBatchResult {
  id: string;
  employeeId: string;
  courseIds: string[];
  created: boolean;
}

interface LearningAssignmentClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
  release(): void;
}

export interface LearningAssignmentDependencies {
  connect(): Promise<LearningAssignmentClient>;
  notify(targetUserId: string, batch: LearningAssignmentBatchResult, input: LearningAssignmentInput): Promise<void>;
}

const defaultDependencies: LearningAssignmentDependencies = {
  connect: () => getPool().connect(),
  notify: async (targetUserId, batch, input) => {
    await NotificationService.createNotification(targetUserId, {
      type: 'learning_assignment',
      title: 'New learning assigned',
      message: input.sourceLabel
        ? `${input.sourceLabel} has been added to your learning.`
        : 'New learning has been assigned to you.',
      data: {
        href: '/learning',
        assignmentBatchId: batch.id,
        sourceType: input.sourceType,
      },
    }, input.actor.userId);
  },
};

function normalizeCourseIds(courseIds: string[]) {
  return [...new Set(courseIds.map(id => id.trim()).filter(Boolean))];
}

function batchResult(row: Record<string, unknown>, created: boolean): LearningAssignmentBatchResult {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    courseIds: Array.isArray(row.course_ids) ? row.course_ids.map(String) : [],
    created,
  };
}

async function findExistingBatch(
  client: LearningAssignmentClient,
  input: LearningAssignmentInput,
): Promise<LearningAssignmentBatchResult | null> {
  const existing = await client.query(
    `SELECT id,employee_id,course_ids
       FROM hr_learning_assignment_batches
      WHERE idempotency_key=$1 AND employee_id=$2::uuid
      LIMIT 1`,
    [input.idempotencyKey, input.employeeId],
  );
  return existing.rows[0] ? batchResult(existing.rows[0], false) : null;
}

export async function assignLearningBatch(
  rawInput: LearningAssignmentInput,
  dependencies: LearningAssignmentDependencies = defaultDependencies,
): Promise<LearningAssignmentBatchResult> {
  const input = { ...rawInput, courseIds: normalizeCourseIds(rawInput.courseIds) };
  if (!input.courseIds.length) throw new Error('Select at least one course.');
  if (!input.sourceLabel.trim()) throw new Error('Assignment source label is required.');
  if (!input.idempotencyKey.trim()) throw new Error('Assignment idempotency key is required.');

  const client = await dependencies.connect();
  let targetUserId: string | null = null;
  let committed = false;
  try {
    await client.query('BEGIN');

    const existing = await findExistingBatch(client, input);
    if (existing) {
      await client.query('COMMIT');
      committed = true;
      return existing;
    }

    const employee = await client.query<{ id: string; user_id: string | null; company_id: string | null }>(
      `SELECT id,user_id,company_id FROM hr_employees WHERE id=$1::uuid LIMIT 1`,
      [input.employeeId],
    );
    const employeeRow = employee.rows[0];
    if (!employeeRow) throw new Error('Employee not found.');
    if (!input.actor.isAdmin && (!input.actor.companyId || employeeRow.company_id !== input.actor.companyId)) {
      throw new Error('Employee is outside your company scope.');
    }
    targetUserId = employeeRow.user_id;

    const courses = await client.query<{ id: string; current_version_id: string | null }>(
      `SELECT id,current_version_id
         FROM hr_learning_courses
        WHERE id=ANY($1::uuid[]) AND status='published' AND is_active=true AND current_version_id IS NOT NULL`,
      [input.courseIds],
    );
    if (courses.rows.length !== input.courseIds.length) {
      throw new Error('All assigned courses must be published and active.');
    }
    const versionByCourse = new Map(courses.rows.map(course => [course.id, course.current_version_id]));

    const insertedBatch = await client.query(
      `INSERT INTO hr_learning_assignment_batches
        (id,employee_id,course_ids,source_type,source_id,source_label,due_date,assigned_by_user_id,idempotency_key,created_at)
       VALUES(gen_random_uuid(),$1::uuid,$2::jsonb,$3,$4::uuid,$5,$6::date,$7::uuid,$8,NOW())
       RETURNING id,employee_id,course_ids`,
      [
        input.employeeId,
        JSON.stringify(input.courseIds),
        input.sourceType,
        input.sourceId ?? null,
        input.sourceLabel.trim(),
        input.dueDate || null,
        input.actor.userId,
        input.idempotencyKey,
      ],
    );
    const batch = batchResult(insertedBatch.rows[0], true);

    for (const courseId of input.courseIds) {
      const enrollment = await client.query<{ id: string }>(
        `INSERT INTO hr_learning_enrollments
          (id,employee_id,course_id,status,progress,due_date,course_version_id,created_at,updated_at)
         VALUES(gen_random_uuid(),$1::uuid,$2::uuid,'assigned',0,$3::date,$4::uuid,NOW(),NOW())
         ON CONFLICT(employee_id,course_id) DO UPDATE SET
           status=CASE WHEN hr_learning_enrollments.status='completed' THEN hr_learning_enrollments.status ELSE hr_learning_enrollments.status END,
           due_date=COALESCE(EXCLUDED.due_date,hr_learning_enrollments.due_date),
           course_version_id=COALESCE(hr_learning_enrollments.course_version_id,EXCLUDED.course_version_id),
           updated_at=NOW()
         RETURNING id`,
        [input.employeeId, courseId, input.dueDate || null, versionByCourse.get(courseId) ?? null],
      );
      const enrollmentId = String(enrollment.rows[0].id);
      await client.query(
        `INSERT INTO hr_learning_activity_events
          (id,enrollment_id,type,metadata,actor_user_id,created_at)
         VALUES(gen_random_uuid(),$1::uuid,'assigned',$2::jsonb,$3::uuid,NOW())`,
        [enrollmentId, { assignmentBatchId: batch.id, sourceType: input.sourceType, sourceId: input.sourceId ?? null, sourceLabel: input.sourceLabel }, input.actor.userId],
      );
    }

    await client.query('COMMIT');
    committed = true;
    if (targetUserId) {
      try {
        await dependencies.notify(targetUserId, batch, input);
      } catch (notificationError) {
        console.error('[Learning] Assignment notification failed after commit:', notificationError);
      }
    }
    return batch;
  } catch (error) {
    if (!committed) await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
