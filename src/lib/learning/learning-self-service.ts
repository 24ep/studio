import { getPool } from '@/lib/db';

export interface LearningSelfServiceQueryExecutor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
}

export interface LearnerEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  category: string | null;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  currentLessonId: string | null;
  courseVersionId: string | null;
}

export interface LearnerPath {
  id: string;
  title: string;
  description: string | null;
  status: string;
  courseIds: string[];
  assignedCourseCount: number;
  completedCourseCount: number;
  totalCourseCount: number;
  progress: number;
}

export interface LearnerCertificate {
  id: string;
  name: string;
  issuer: string | null;
  status: string;
  issuedAt: string | Date | null;
  expiresAt: string | Date | null;
  verificationUrl: string | null;
}

export interface LearningSelfServiceContext {
  available: boolean;
  employeeId: string | null;
  enrollments: LearnerEnrollment[];
  paths: LearnerPath[];
  certificates: LearnerCertificate[];
}

export interface LearningCatalogCourse {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  durationHours: number | null;
  isRequired: boolean;
  coverImageUrl: string | null;
  enrollmentId: string | null;
  status: string | null;
  progress: number;
  dueDate: string | Date | null;
}

function db(executor?: LearningSelfServiceQueryExecutor): LearningSelfServiceQueryExecutor {
  return executor ?? getPool();
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function getLearningSelfServiceContext(
  employeeId: string | null,
  executor?: LearningSelfServiceQueryExecutor,
): Promise<LearningSelfServiceContext> {
  if (!employeeId) {
    return { available: false, employeeId: null, enrollments: [], paths: [], certificates: [] };
  }

  const client = db(executor);
  const enrollmentResult = await client.query(
    `SELECT e.id,e.course_id,c.title AS course_title,c.category AS course_category,c.description AS course_description,
            e.status,e.progress,e.due_date,e.completed_at,e.current_lesson_id,e.course_version_id
       FROM hr_learning_enrollments e
       JOIN hr_learning_courses c ON c.id=e.course_id
      WHERE e.employee_id=$1::uuid AND e.status<>'archived'
      ORDER BY COALESCE(e.last_activity_at,e.updated_at) DESC`,
    [employeeId],
  );

  const enrollmentCourseIds = new Set(enrollmentResult.rows.map(row => String(row.course_id)));
  const completedCourseIds = new Set(
    enrollmentResult.rows.filter(row => row.status === 'completed').map(row => String(row.course_id)),
  );

  const [pathResult, certificateResult] = await Promise.all([
    client.query(
      `SELECT id,title,description,status,course_ids
         FROM hr_learning_paths
        WHERE status<>'archived'
        ORDER BY updated_at DESC`,
    ),
    client.query(
      `SELECT id,name,issuer,status,issued_at,expires_at,verification_url
         FROM hr_certifications
        WHERE employee_id=$1::uuid AND COALESCE(record_type,'employee')='employee' AND status<>'archived'
        ORDER BY COALESCE(expires_at,issued_at) DESC NULLS LAST`,
      [employeeId],
    ),
  ]);

  const enrollments: LearnerEnrollment[] = enrollmentResult.rows.map(row => ({
    id: String(row.id),
    courseId: String(row.course_id),
    courseTitle: String(row.course_title ?? ''),
    category: row.course_category == null ? null : String(row.course_category),
    description: row.course_description == null ? null : String(row.course_description),
    status: String(row.status ?? 'assigned'),
    progress: Number(row.progress ?? 0),
    dueDate: (row.due_date as string | Date | null | undefined) ?? null,
    completedAt: (row.completed_at as string | Date | null | undefined) ?? null,
    currentLessonId: row.current_lesson_id == null ? null : String(row.current_lesson_id),
    courseVersionId: row.course_version_id == null ? null : String(row.course_version_id),
  }));

  const paths: LearnerPath[] = pathResult.rows.map(row => {
    const courseIds = stringArray(row.course_ids);
    const assignedCourseCount = courseIds.filter(id => enrollmentCourseIds.has(id)).length;
    const completedCourseCount = courseIds.filter(id => completedCourseIds.has(id)).length;
    const totalCourseCount = courseIds.length;
    return {
      id: String(row.id),
      title: String(row.title ?? ''),
      description: row.description == null ? null : String(row.description),
      status: String(row.status ?? 'draft'),
      courseIds,
      assignedCourseCount,
      completedCourseCount,
      totalCourseCount,
      progress: totalCourseCount ? Math.round((completedCourseCount / totalCourseCount) * 100) : 0,
    };
  }).filter(path => path.assignedCourseCount > 0);

  const certificates: LearnerCertificate[] = certificateResult.rows.map(row => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    issuer: row.issuer == null ? null : String(row.issuer),
    status: String(row.status ?? 'active'),
    issuedAt: (row.issued_at as string | Date | null | undefined) ?? null,
    expiresAt: (row.expires_at as string | Date | null | undefined) ?? null,
    verificationUrl: row.verification_url == null ? null : String(row.verification_url),
  }));

  return { available: true, employeeId, enrollments, paths, certificates };
}

export async function getLearningCatalog(
  employeeId: string | null,
  executor?: LearningSelfServiceQueryExecutor,
): Promise<LearningCatalogCourse[]> {
  const result = await db(executor).query(
    `SELECT c.id,c.title,c.category,c.description,c.duration_hours,c.is_required,c.cover_image_url,
            e.id AS enrollment_id,e.status AS enrollment_status,e.progress AS enrollment_progress,e.due_date
       FROM hr_learning_courses c
       LEFT JOIN hr_learning_enrollments e
         ON e.course_id=c.id AND e.employee_id = $1::uuid AND e.status<>'archived'
      WHERE c.status = 'published' AND c.is_active = true
      ORDER BY c.is_required DESC,c.updated_at DESC,c.title ASC`,
    [employeeId],
  );

  return result.rows.map(row => ({
    id: String(row.id),
    title: String(row.title ?? ''),
    category: row.category == null ? null : String(row.category),
    description: row.description == null ? null : String(row.description),
    durationHours: row.duration_hours == null ? null : Number(row.duration_hours),
    isRequired: Boolean(row.is_required),
    coverImageUrl: row.cover_image_url == null ? null : String(row.cover_image_url),
    enrollmentId: row.enrollment_id == null ? null : String(row.enrollment_id),
    status: row.enrollment_status == null ? null : String(row.enrollment_status),
    progress: Number(row.enrollment_progress ?? 0),
    dueDate: (row.due_date as string | Date | null | undefined) ?? null,
  }));
}
