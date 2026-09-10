import { getPool } from '@/lib/db';

export interface LearningQueryExecutor {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>;
}

interface LearningContentAccessRow extends Record<string, unknown> {
  enrollment_id: string;
  course_id: string;
  course_version_id: string;
  enrollment_status: string;
  lesson_id: string;
  block_id: string | null;
  block_type: string | null;
  block_content: Record<string, unknown> | null;
  passing_score: number | string | null;
  max_attempts: number | string | null;
}

export interface LearningContentAccess {
  enrollmentId: string;
  courseId: string;
  courseVersionId: string;
  enrollmentStatus: string;
  lessonId: string;
  blockId: string | null;
  blockType: string | null;
  blockContent: Record<string, unknown> | null;
  passingScore: number;
  maxAttempts: number;
}

const CONTENT_ACCESS_SQL = `SELECT
    e.id AS enrollment_id,
    e.course_id,
    e.course_version_id,
    e.status AS enrollment_status,
    l.id AS lesson_id,
    b.id AS block_id,
    b.type AS block_type,
    b.content AS block_content,
    c.passing_score,
    c.max_attempts
  FROM hr_learning_enrollments e
  JOIN hr_learning_courses c ON c.id = e.course_id
  JOIN hr_learning_course_sections s ON s.version_id = e.course_version_id
  JOIN hr_learning_lessons l
    ON l.section_id = s.id
   AND ($3::uuid IS NULL OR l.id = $3::uuid)
  LEFT JOIN hr_learning_content_blocks b
    ON b.lesson_id = l.id
   AND ($4::uuid IS NULL OR b.id = $4::uuid)
  WHERE e.id = $1::uuid
    AND e.employee_id = $2::uuid
    AND ($3::uuid IS NOT NULL OR $4::uuid IS NOT NULL)
    AND ($4::uuid IS NULL OR b.id IS NOT NULL)
  ORDER BY s.position, l.position
  LIMIT 1`;

export async function assertEnrollmentContentAccess(
  input: {
    enrollmentId: string;
    employeeId: string;
    lessonId?: string;
    blockId?: string;
  },
  executor?: LearningQueryExecutor,
): Promise<LearningContentAccess> {
  if (!input.lessonId && !input.blockId) {
    throw new Error('A lesson or content block is required.');
  }

  const values = [input.enrollmentId, input.employeeId, input.lessonId ?? null, input.blockId ?? null];
  const result = executor
    ? await executor.query(CONTENT_ACCESS_SQL, values)
    : await getPool().query<LearningContentAccessRow>(CONTENT_ACCESS_SQL, values);
  const row = result.rows[0] as LearningContentAccessRow | undefined;

  if (!row) {
    throw new Error('Learning content is not part of this enrollment.');
  }

  return {
    enrollmentId: row.enrollment_id,
    courseId: row.course_id,
    courseVersionId: row.course_version_id,
    enrollmentStatus: row.enrollment_status,
    lessonId: row.lesson_id,
    blockId: row.block_id ?? null,
    blockType: row.block_type ?? null,
    blockContent: row.block_content ?? null,
    passingScore: Number(row.passing_score ?? 80),
    maxAttempts: Number(row.max_attempts ?? 3),
  };
}

export function assertLearningEnrollmentMutable(access: Pick<LearningContentAccess, 'enrollmentStatus'>) {
  if (access.enrollmentStatus === 'completed') {
    throw new Error('This enrollment is already completed.');
  }
}
