import { getPool } from '@/lib/db';

export type AuthoringBlockType = 'text' | 'video' | 'attachment' | 'acknowledgement' | 'break' | 'quiz' | 'assignment';

export interface AuthoringBlock {
  type: AuthoringBlockType;
  title?: string;
  required?: boolean;
  content: Record<string, unknown>;
}

export interface AuthoringLesson {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  minimumActiveSeconds?: number;
  blocks: AuthoringBlock[];
}

export interface AuthoringSection {
  title: string;
  lessons: AuthoringLesson[];
}

export interface AuthoringRules {
  passingScore?: number;
  maxAttempts?: number;
  requiredWatchPercent?: number;
}

export interface CourseMetadataInput {
  title: string;
  category?: string | null;
  description?: string | null;
  durationHours?: number | null;
  isRequired?: boolean;
  coverImageUrl?: string | null;
  objectives?: string[];
  ownerName?: string | null;
}

export interface CreateCourseAuthoringInput {
  metadata: CourseMetadataInput;
  sections: AuthoringSection[];
  rules?: AuthoringRules;
  publish?: boolean;
}

interface AuthoringClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
  release(): void;
}

export interface LearningAuthoringDependencies {
  connect(): Promise<AuthoringClient>;
}

const defaultDependencies: LearningAuthoringDependencies = { connect: () => getPool().connect() };
const defaultRules = { sequential: true, passingScore: 80, maxAttempts: 3, requiredWatchPercent: 90 };

async function persistCurriculum(
  client: AuthoringClient,
  courseId: string,
  sections: AuthoringSection[],
  rules: AuthoringRules,
  userId: string,
  publish: boolean,
) {
  const current = await client.query<{ version: number }>(
    `SELECT COALESCE(max(version),0)::int + 1 AS version FROM hr_learning_course_versions WHERE course_id=$1::uuid`,
    [courseId],
  );
  const version = Number(current.rows[0]?.version ?? 1);
  const versionResult = await client.query<{ id: string }>(
    `INSERT INTO hr_learning_course_versions(id,course_id,version,status,rules,published_at,published_by,created_at,updated_at)
     VALUES(gen_random_uuid(),$1::uuid,$2,$3,$4::jsonb,CASE WHEN $5 THEN NOW() END,CASE WHEN $5 THEN $6::uuid END,NOW(),NOW())
     RETURNING id`,
    [courseId, version, publish ? 'published' : 'draft', { ...defaultRules, ...rules }, publish, userId],
  );
  const versionId = versionResult.rows[0].id;

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionResult = await client.query<{ id: string }>(
      `INSERT INTO hr_learning_course_sections(id,version_id,title,position,created_at,updated_at)
       VALUES(gen_random_uuid(),$1::uuid,$2,$3,NOW(),NOW()) RETURNING id`,
      [versionId, section.title, sectionIndex],
    );
    for (const [lessonIndex, lesson] of section.lessons.entries()) {
      const lessonResult = await client.query<{ id: string }>(
        `INSERT INTO hr_learning_lessons(id,section_id,title,description,position,estimated_minutes,minimum_active_seconds,created_at,updated_at)
         VALUES(gen_random_uuid(),$1::uuid,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING id`,
        [sectionResult.rows[0].id, lesson.title, lesson.description ?? null, lessonIndex, lesson.estimatedMinutes ?? 5, lesson.minimumActiveSeconds ?? 0],
      );
      for (const [blockIndex, block] of lesson.blocks.entries()) {
        await client.query(
          `INSERT INTO hr_learning_content_blocks(id,lesson_id,type,title,position,required,content,created_at,updated_at)
           VALUES(gen_random_uuid(),$1::uuid,$2,$3,$4,$5,$6::jsonb,NOW(),NOW())`,
          [lessonResult.rows[0].id, block.type, block.title ?? null, blockIndex, block.required !== false, block.content],
        );
      }
    }
  }

  if (publish) {
    await client.query(
      `UPDATE hr_learning_courses SET current_version_id=$2::uuid,status='published',is_active=true,updated_at=NOW() WHERE id=$1::uuid`,
      [courseId, versionId],
    );
  }
  return { versionId, version, status: publish ? 'published' as const : 'draft' as const };
}

async function insertCourse(client: AuthoringClient, metadata: CourseMetadataInput) {
  const result = await client.query<{ id: string }>(
    `INSERT INTO hr_learning_courses
      (id,title,category,description,duration_hours,is_required,is_active,status,objectives,owner_name,cover_image_url,created_at,updated_at)
     VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,true,'draft',$6::jsonb,$7,$8,NOW(),NOW()) RETURNING id`,
    [metadata.title, metadata.category ?? null, metadata.description ?? null, metadata.durationHours ?? null, metadata.isRequired ?? false, metadata.objectives ?? [], metadata.ownerName ?? null, metadata.coverImageUrl ?? null],
  );
  return result.rows[0].id;
}

export async function createCourseWithCurriculum(
  input: CreateCourseAuthoringInput,
  userId: string,
  dependencies: LearningAuthoringDependencies = defaultDependencies,
) {
  if (!input.metadata.title.trim()) throw new Error('Course title is required.');
  if (!input.sections.length) throw new Error('Course curriculum must contain at least one section.');
  const client = await dependencies.connect();
  try {
    await client.query('BEGIN');
    const courseId = await insertCourse(client, input.metadata);
    const curriculum = await persistCurriculum(client, courseId, input.sections, input.rules ?? {}, userId, Boolean(input.publish));
    await client.query('COMMIT');
    return { courseId, ...curriculum };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCourseCurriculumRevision(
  courseId: string,
  sections: AuthoringSection[],
  rules: AuthoringRules,
  userId: string,
  publish = false,
  dependencies: LearningAuthoringDependencies = defaultDependencies,
) {
  const client = await dependencies.connect();
  try {
    await client.query('BEGIN');
    const result = await persistCurriculum(client, courseId, sections, rules, userId, publish);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function createLearningPathWithCourses(
  input: { title: string; description?: string | null; courses: CreateCourseAuthoringInput[] },
  userId: string,
  dependencies: LearningAuthoringDependencies = defaultDependencies,
) {
  if (!input.courses.length) throw new Error('Learning path requires at least one course.');
  const client = await dependencies.connect();
  try {
    await client.query('BEGIN');
    const courseIds: string[] = [];
    for (const course of input.courses) {
      const courseId = await insertCourse(client, course.metadata);
      await persistCurriculum(client, courseId, course.sections, course.rules ?? {}, userId, Boolean(course.publish));
      courseIds.push(courseId);
    }
    const path = await client.query<{ id: string }>(
      `INSERT INTO hr_learning_paths(id,title,description,status,course_ids,created_at,updated_at)
       VALUES(gen_random_uuid(),$1,$2,'draft',$3::jsonb,NOW(),NOW()) RETURNING id`,
      [input.title, input.description ?? null, courseIds],
    );
    await client.query('COMMIT');
    return { pathId: path.rows[0].id, courseIds };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
