import { getPool } from '@/lib/db';
import { assertEnrollmentContentAccess, assertLearningEnrollmentMutable } from '@/lib/learning/learning-integrity';

export { employeeForUser } from '@/lib/learning/learning-access';

export type LearningBlockType = 'text' | 'video' | 'attachment' | 'acknowledgement' | 'break' | 'quiz' | 'assignment';

export interface CurriculumBlock {
  id?: string;
  type: LearningBlockType;
  title?: string;
  required?: boolean;
  content: Record<string, unknown>;
}

export interface CurriculumLesson {
  id?: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  minimumActiveSeconds?: number;
  blocks: CurriculumBlock[];
}

export interface CurriculumSection {
  id?: string;
  title: string;
  lessons: CurriculumLesson[];
}

export interface CourseRules {
  sequential: true;
  passingScore: number;
  maxAttempts: number;
  requiredWatchPercent: number;
}

export interface CourseDetail {
  course: Record<string, unknown>;
  enrollment: Record<string, unknown> | null;
  sections: Array<Record<string, unknown> & { lessons: Array<Record<string, unknown> & { blocks: Record<string, unknown>[] }> }>;
  progress: Record<string, Record<string, unknown>>;
  rules: CourseRules;
}

const defaultRules: CourseRules = { sequential: true, passingScore: 80, maxAttempts: 3, requiredWatchPercent: 90 };

export async function getCourseDetail(courseId: string, employeeId?: string | null, allowDraft = false): Promise<CourseDetail | null> {
  const courseResult = await getPool().query(
    `SELECT c.*, v.id AS version_id, v.version, v.rules, v.status AS version_status
       FROM hr_learning_courses c
       LEFT JOIN LATERAL (
         SELECT candidate.* FROM hr_learning_course_versions candidate
          WHERE candidate.course_id = c.id
            AND (candidate.id = c.current_version_id OR ($2::boolean AND candidate.status = 'draft'))
          ORDER BY CASE WHEN $2::boolean AND candidate.status = 'draft' THEN 0 ELSE 1 END, candidate.version DESC
          LIMIT 1
       ) v ON true
      WHERE c.id = $1 AND ($2::boolean OR c.status = 'published') LIMIT 1`,
    [courseId, allowDraft],
  );
  if (!courseResult.rows[0]) return null;
  const course = courseResult.rows[0];
  const versionId = course.version_id as string | undefined;
  const enrollmentResult = employeeId
    ? await getPool().query(
        `SELECT * FROM hr_learning_enrollments WHERE employee_id = $1 AND course_id = $2 LIMIT 1`,
        [employeeId, courseId],
      )
    : { rows: [] };
  const enrollment = enrollmentResult.rows[0] || null;
  const sectionsResult = versionId
    ? await getPool().query(`SELECT * FROM hr_learning_course_sections WHERE version_id = $1 ORDER BY position`, [versionId])
    : { rows: [] };
  const sectionIds = sectionsResult.rows.map(row => row.id);
  const lessonsResult = sectionIds.length
    ? await getPool().query(`SELECT * FROM hr_learning_lessons WHERE section_id = ANY($1::uuid[]) ORDER BY position`, [sectionIds])
    : { rows: [] };
  const lessonIds = lessonsResult.rows.map(row => row.id);
  const blocksResult = lessonIds.length
    ? await getPool().query(`SELECT * FROM hr_learning_content_blocks WHERE lesson_id = ANY($1::uuid[]) ORDER BY position`, [lessonIds])
    : { rows: [] };
  const progressResult = enrollment && lessonIds.length
    ? await getPool().query(`SELECT * FROM hr_learning_lesson_progress WHERE enrollment_id = $1 AND lesson_id = ANY($2::uuid[])`, [enrollment.id, lessonIds])
    : { rows: [] };
  const progress = Object.fromEntries(progressResult.rows.map(row => [row.lesson_id, row]));
  let previousComplete = true;
  const sections = sectionsResult.rows.map(section => ({
    ...section,
    lessons: lessonsResult.rows.filter(lesson => lesson.section_id === section.id).map(lesson => {
      const lessonProgress = progress[lesson.id];
      const unlocked = previousComplete;
      previousComplete = lessonProgress?.status === 'completed';
      return {
        ...lesson,
        unlocked,
        blocks: blocksResult.rows.filter(block => block.lesson_id === lesson.id),
      };
    }),
  }));
  return { course, enrollment, sections, progress, rules: { ...defaultRules, ...(course.rules || {}) } };
}

export async function startCourse(courseId: string, employeeId: string) {
  const detail = await getCourseDetail(courseId, employeeId);
  if (!detail?.course.version_id) throw new Error('This course has no published curriculum.');
  const firstLesson = detail.sections.flatMap(section => section.lessons)[0];
  const result = await getPool().query(
    `INSERT INTO hr_learning_enrollments
      (id, employee_id, course_id, status, progress, course_version_id, current_lesson_id, started_at, last_activity_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'in_progress', 0, $3, $4, NOW(), NOW(), NOW(), NOW())
     ON CONFLICT (employee_id, course_id) DO UPDATE SET
       status = CASE WHEN hr_learning_enrollments.status = 'assigned' THEN 'in_progress' ELSE hr_learning_enrollments.status END,
       course_version_id = COALESCE(hr_learning_enrollments.course_version_id, EXCLUDED.course_version_id),
       current_lesson_id = COALESCE(hr_learning_enrollments.current_lesson_id, EXCLUDED.current_lesson_id),
       started_at = COALESCE(hr_learning_enrollments.started_at, NOW()), last_activity_at = NOW(), updated_at = NOW()
     RETURNING *`,
    [employeeId, courseId, detail.course.version_id, firstLesson?.id || null],
  );
  if (firstLesson) {
    await getPool().query(
      `INSERT INTO hr_learning_lesson_progress (id, enrollment_id, lesson_id, status, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'in_progress', NOW()) ON CONFLICT (enrollment_id, lesson_id) DO NOTHING`,
      [result.rows[0].id, firstLesson.id],
    );
  }
  return result.rows[0];
}

export async function recordHeartbeat(input: {
  enrollmentId: string; lessonId: string; employeeId: string; seconds: number; furthestSecond?: number;
}) {
  const access = await assertEnrollmentContentAccess({
    enrollmentId: input.enrollmentId,
    employeeId: input.employeeId,
    lessonId: input.lessonId,
  });
  assertLearningEnrollmentMutable(access);

  const seconds = Math.max(0, Math.min(30, Math.floor(input.seconds)));
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO hr_learning_lesson_progress
        (id, enrollment_id, lesson_id, status, active_seconds, furthest_second, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'in_progress', $3, $4, NOW())
       ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET
         status = CASE WHEN hr_learning_lesson_progress.status = 'locked' THEN 'in_progress' ELSE hr_learning_lesson_progress.status END,
         active_seconds = hr_learning_lesson_progress.active_seconds + $3,
         furthest_second = GREATEST(hr_learning_lesson_progress.furthest_second, $4), updated_at = NOW()`,
      [input.enrollmentId, access.lessonId, seconds, Math.max(0, Math.floor(input.furthestSecond || 0))],
    );
    await client.query(
      `UPDATE hr_learning_enrollments SET active_seconds = active_seconds + $2, current_lesson_id = $3, last_activity_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [input.enrollmentId, seconds, access.lessonId],
    );
    await client.query(
      `INSERT INTO hr_learning_activity_events (id, enrollment_id, lesson_id, type, seconds, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'heartbeat', $3, NOW())`,
      [input.enrollmentId, access.lessonId, seconds],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function completeBlock(input: { enrollmentId: string; lessonId: string; blockId: string; employeeId: string }) {
  const access = await assertEnrollmentContentAccess({
    enrollmentId: input.enrollmentId,
    employeeId: input.employeeId,
    lessonId: input.lessonId,
    blockId: input.blockId,
  });
  assertLearningEnrollmentMutable(access);

  const progressResult = await getPool().query<{ furthest_second: number }>(
    `SELECT furthest_second FROM hr_learning_lesson_progress WHERE enrollment_id=$1 AND lesson_id=$2 LIMIT 1`,
    [input.enrollmentId, access.lessonId],
  );
  const progress = progressResult.rows[0];
  if (!progress) throw new Error('Lesson progress not found.');

  if (access.blockType === 'video') {
    const duration = Number(access.blockContent?.durationSeconds || 0);
    const watchPercent = Number(access.blockContent?.requiredWatchPercent || 90);
    if (!duration || progress.furthest_second < Math.ceil(duration * watchPercent / 100)) {
      throw new Error(`Watch at least ${watchPercent}% of the video before completing this lesson.`);
    }
  }

  const result = await getPool().query(
    `UPDATE hr_learning_lesson_progress lp SET completed_blocks =
       CASE WHEN lp.completed_blocks ? $4 THEN lp.completed_blocks ELSE lp.completed_blocks || to_jsonb($4::text) END, updated_at = NOW()
      FROM hr_learning_enrollments e
      WHERE lp.enrollment_id = $1 AND lp.lesson_id = $2 AND e.id = lp.enrollment_id AND e.employee_id = $3 RETURNING lp.*`,
    [input.enrollmentId, access.lessonId, input.employeeId, input.blockId],
  );
  if (!result.rowCount) throw new Error('Lesson progress not found.');
  await recalculateCompletion(input.enrollmentId, access.lessonId);
  return result.rows[0];
}

export async function submitQuiz(input: { enrollmentId: string; blockId: string; employeeId: string; answers: Record<string, string> }) {
  const access = await assertEnrollmentContentAccess({
    enrollmentId: input.enrollmentId,
    employeeId: input.employeeId,
    blockId: input.blockId,
  });
  assertLearningEnrollmentMutable(access);
  if (access.blockType !== 'quiz') throw new Error('Quiz not found.');

  const prior = await getPool().query<{ count: number }>(
    `SELECT count(*)::int AS count FROM hr_learning_quiz_attempts WHERE enrollment_id=$1 AND block_id=$2`,
    [input.enrollmentId, input.blockId],
  );
  const attempt = prior.rows[0].count + 1;
  if (attempt > access.maxAttempts) throw new Error('No quiz attempts remaining.');
  const questions = Array.isArray(access.blockContent?.questions) ? access.blockContent.questions : [];
  const correct = questions.filter((question: { id: string; correctAnswer: string }) => input.answers[question.id] === question.correctAnswer).length;
  const score = questions.length ? Math.round(correct / questions.length * 100) : 0;
  const passed = score >= access.passingScore;
  await getPool().query(
    `INSERT INTO hr_learning_quiz_attempts (id,enrollment_id,block_id,answers,score,passed,attempt,created_at)
     VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,NOW())`,
    [input.enrollmentId, input.blockId, input.answers, score, passed, attempt],
  );
  if (passed) await completeBlock({
    enrollmentId: input.enrollmentId,
    lessonId: access.lessonId,
    blockId: input.blockId,
    employeeId: input.employeeId,
  });
  return { score, passed, attempt, attemptsRemaining: Math.max(0, access.maxAttempts - attempt) };
}

export async function submitAssignment(input: { enrollmentId: string; blockId: string; employeeId: string; text?: string; fileUrl?: string }) {
  const access = await assertEnrollmentContentAccess({
    enrollmentId: input.enrollmentId,
    employeeId: input.employeeId,
    blockId: input.blockId,
  });
  assertLearningEnrollmentMutable(access);
  if (access.blockType !== 'assignment') throw new Error('Assignment not found.');

  const result = await getPool().query(
    `INSERT INTO hr_learning_assignment_submissions(id,enrollment_id,block_id,text,file_url,status,created_at,updated_at)
     VALUES(gen_random_uuid(),$1,$2,$3,$4,'pending',NOW(),NOW())
     ON CONFLICT(enrollment_id,block_id) DO UPDATE SET text=$3,file_url=$4,status='pending',feedback=NULL,reviewed_by=NULL,reviewed_at=NULL,updated_at=NOW()
     RETURNING *`,
    [input.enrollmentId, input.blockId, input.text || null, input.fileUrl || null],
  );
  return result.rows[0];
}

export async function reviewAssignment(input: { submissionId: string; approved: boolean; feedback?: string; reviewerId: string }) {
  const result = await getPool().query(
    `UPDATE hr_learning_assignment_submissions SET status=$2,feedback=$3,reviewed_by=$4,reviewed_at=NOW(),updated_at=NOW()
      WHERE id=$1 RETURNING *`, [input.submissionId, input.approved ? 'approved' : 'changes_requested', input.feedback || null, input.reviewerId],
  );
  const submission = result.rows[0];
  if (!submission) throw new Error('Submission not found.');
  if (input.approved) {
    const row = await getPool().query(`SELECT lesson_id FROM hr_learning_content_blocks WHERE id=$1`, [submission.block_id]);
    const enrollment = await getPool().query(`SELECT employee_id FROM hr_learning_enrollments WHERE id=$1`, [submission.enrollment_id]);
    await completeBlock({ enrollmentId: submission.enrollment_id, lessonId: row.rows[0].lesson_id, blockId: submission.block_id, employeeId: enrollment.rows[0].employee_id });
  }
  return submission;
}

export async function overrideEnrollment(input: { enrollmentId: string; reason: string; actorUserId: string }) {
  const result = await getPool().query(
    `UPDATE hr_learning_enrollments SET status='completed',progress=100,completed_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`,
    [input.enrollmentId],
  );
  if (!result.rowCount) throw new Error('Enrollment not found.');
  await getPool().query(
    `INSERT INTO hr_learning_activity_events(id,enrollment_id,type,metadata,actor_user_id,created_at)
     VALUES(gen_random_uuid(),$1,'admin_override',$2,$3,NOW())`, [input.enrollmentId, { reason: input.reason }, input.actorUserId],
  );
  return result.rows[0];
}

async function recalculateCompletion(enrollmentId: string, lessonId: string) {
  const check = await getPool().query(
    `SELECT lp.active_seconds, lp.completed_blocks, l.minimum_active_seconds,
            array_agg(b.id::text) FILTER (WHERE b.required) AS required_blocks
       FROM hr_learning_lesson_progress lp JOIN hr_learning_lessons l ON l.id=lp.lesson_id
       LEFT JOIN hr_learning_content_blocks b ON b.lesson_id=l.id
      WHERE lp.enrollment_id=$1 AND lp.lesson_id=$2 GROUP BY lp.id,l.id`, [enrollmentId, lessonId],
  );
  const row = check.rows[0];
  if (!row) return;
  const completed = new Set<string>(row.completed_blocks || []);
  const requirementsMet = (row.required_blocks || []).every((id: string) => completed.has(id)) && row.active_seconds >= row.minimum_active_seconds;
  if (!requirementsMet) return;
  await getPool().query(`UPDATE hr_learning_lesson_progress SET status='completed',completed_at=NOW(),updated_at=NOW() WHERE enrollment_id=$1 AND lesson_id=$2`, [enrollmentId, lessonId]);
  const remaining = await getPool().query(
    `SELECT l.id FROM hr_learning_enrollments e
      JOIN hr_learning_course_sections s ON s.version_id=e.course_version_id
      JOIN hr_learning_lessons l ON l.section_id=s.id
      LEFT JOIN hr_learning_lesson_progress p ON p.enrollment_id=e.id AND p.lesson_id=l.id
     WHERE e.id=$1 AND COALESCE(p.status,'locked') <> 'completed' ORDER BY s.position,l.position`, [enrollmentId],
  );
  const totals = await getPool().query(
    `SELECT count(*)::int total, count(*) FILTER(WHERE p.status='completed')::int complete
       FROM hr_learning_enrollments e JOIN hr_learning_course_sections s ON s.version_id=e.course_version_id
       JOIN hr_learning_lessons l ON l.section_id=s.id LEFT JOIN hr_learning_lesson_progress p ON p.enrollment_id=e.id AND p.lesson_id=l.id WHERE e.id=$1`, [enrollmentId],
  );
  const { total, complete } = totals.rows[0];
  const progress = total ? Math.round(complete / total * 100) : 0;
  await getPool().query(
    `UPDATE hr_learning_enrollments SET progress=$2,status=CASE WHEN $2=100 THEN 'completed' ELSE 'in_progress' END,
      completed_at=CASE WHEN $2=100 THEN NOW() ELSE completed_at END,current_lesson_id=$3,updated_at=NOW() WHERE id=$1`,
    [enrollmentId, progress, remaining.rows[0]?.id || lessonId],
  );
  const next = remaining.rows[0]?.id;
  if (next) await getPool().query(
    `INSERT INTO hr_learning_lesson_progress(id,enrollment_id,lesson_id,status,updated_at)
     VALUES(gen_random_uuid(),$1,$2,'in_progress',NOW()) ON CONFLICT(enrollment_id,lesson_id) DO UPDATE SET status=CASE WHEN hr_learning_lesson_progress.status='locked' THEN 'in_progress' ELSE hr_learning_lesson_progress.status END`,
    [enrollmentId, next],
  );
}

export async function saveCurriculum(courseId: string, sections: CurriculumSection[], rules: Partial<CourseRules>, userId: string, publish = false) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(`SELECT COALESCE(max(version),0)::int + 1 AS version FROM hr_learning_course_versions WHERE course_id=$1`, [courseId]);
    const version = current.rows[0].version;
    const versionResult = await client.query(
      `INSERT INTO hr_learning_course_versions(id,course_id,version,status,rules,published_at,published_by,created_at,updated_at)
       VALUES(gen_random_uuid(),$1,$2,$3,$4,CASE WHEN $5 THEN NOW() END,CASE WHEN $5 THEN $6::uuid END,NOW(),NOW()) RETURNING id`,
      [courseId, version, publish ? 'published' : 'draft', { ...defaultRules, ...rules }, publish, userId],
    );
    const versionId = versionResult.rows[0].id;
    for (const [sectionIndex, section] of sections.entries()) {
      const sectionResult = await client.query(
        `INSERT INTO hr_learning_course_sections(id,version_id,title,position,created_at,updated_at) VALUES(gen_random_uuid(),$1,$2,$3,NOW(),NOW()) RETURNING id`,
        [versionId, section.title, sectionIndex],
      );
      for (const [lessonIndex, lesson] of section.lessons.entries()) {
        const lessonResult = await client.query(
          `INSERT INTO hr_learning_lessons(id,section_id,title,description,position,estimated_minutes,minimum_active_seconds,created_at,updated_at)
           VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING id`,
          [sectionResult.rows[0].id, lesson.title, lesson.description || null, lessonIndex, lesson.estimatedMinutes || 5, lesson.minimumActiveSeconds || 0],
        );
        for (const [blockIndex, block] of lesson.blocks.entries()) await client.query(
          `INSERT INTO hr_learning_content_blocks(id,lesson_id,type,title,position,required,content,created_at,updated_at)
           VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          [lessonResult.rows[0].id, block.type, block.title || null, blockIndex, block.required !== false, block.content],
        );
      }
    }
    if (publish) await client.query(`UPDATE hr_learning_courses SET current_version_id=$2,status='published',updated_at=NOW() WHERE id=$1`, [courseId, versionId]);
    await client.query('COMMIT');
    return { versionId, version, status: publish ? 'published' : 'draft' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function learningReport() {
  const summary = await getPool().query(
    `SELECT count(*)::int assigned,
      count(*) FILTER(WHERE status='assigned')::int not_started,
      count(*) FILTER(WHERE status='in_progress')::int in_progress,
      count(*) FILTER(WHERE status='completed')::int completed,
      count(*) FILTER(WHERE due_date<NOW() AND status<>'completed')::int overdue,
      COALESCE(sum(active_seconds),0)::int active_seconds FROM hr_learning_enrollments`,
  );
  const rows = await getPool().query(
    `SELECT e.id,e.status,e.progress,e.due_date,e.completed_at,e.active_seconds,c.title course_title,
      concat(emp.first_name,' ',emp.last_name) employee_name
     FROM hr_learning_enrollments e JOIN hr_learning_courses c ON c.id=e.course_id
     JOIN hr_employees emp ON emp.id=e.employee_id ORDER BY e.updated_at DESC LIMIT 500`,
  );
  const submissions = await getPool().query(
    `SELECT s.*,c.title course_title,concat(emp.first_name,' ',emp.last_name) employee_name,b.title block_title
      FROM hr_learning_assignment_submissions s JOIN hr_learning_enrollments e ON e.id=s.enrollment_id
      JOIN hr_learning_courses c ON c.id=e.course_id JOIN hr_employees emp ON emp.id=e.employee_id
      JOIN hr_learning_content_blocks b ON b.id=s.block_id ORDER BY s.updated_at DESC LIMIT 200`,
  );
  return { summary: summary.rows[0], rows: rows.rows, submissions: submissions.rows };
}
