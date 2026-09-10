import { describe, expect, it, vi } from 'vitest';
import {
  createCourseWithCurriculum,
  createLearningPathWithCourses,
  type LearningAuthoringDependencies,
} from './learning-course-authoring';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function dependencies(options?: { failBlock?: boolean }) {
  const statements: string[] = [];
  let courseIndex = 0;
  const client = {
    query: vi.fn(async (sql: string) => {
      statements.push(sql);
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('INSERT INTO hr_learning_courses')) return { rows: [{ id: `course-${++courseIndex}` }], rowCount: 1 };
      if (sql.includes('COALESCE(max(version)')) return { rows: [{ version: 1 }], rowCount: 1 };
      if (sql.includes('INSERT INTO hr_learning_course_versions')) return { rows: [{ id: `version-${courseIndex}` }], rowCount: 1 };
      if (sql.includes('INSERT INTO hr_learning_course_sections')) return { rows: [{ id: `section-${courseIndex}` }], rowCount: 1 };
      if (sql.includes('INSERT INTO hr_learning_lessons')) return { rows: [{ id: `lesson-${courseIndex}` }], rowCount: 1 };
      if (sql.includes('INSERT INTO hr_learning_content_blocks')) {
        if (options?.failBlock) throw new Error('forced curriculum failure');
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes('UPDATE hr_learning_courses')) return { rows: [], rowCount: 1 };
      if (sql.includes('INSERT INTO hr_learning_paths')) return { rows: [{ id: 'path-1' }], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    }),
    release: vi.fn(),
  };
  const deps = { connect: vi.fn(async () => client) } as unknown as LearningAuthoringDependencies;
  return { deps, statements };
}

const course = {
  metadata: { title: 'Safety', category: 'Compliance', description: 'Safety course', durationHours: 1, isRequired: true },
  sections: [{ title: 'Start', lessons: [{ title: 'Introduction', blocks: [{ type: 'text' as const, content: { text: 'Learn safely' } }] }] }],
  rules: { passingScore: 80, maxAttempts: 3, requiredWatchPercent: 90 },
};

describe('learning course authoring', () => {
  it('commits course metadata and initial curriculum in one transaction', async () => {
    const { deps, statements } = dependencies();
    const result = await createCourseWithCurriculum({ ...course, publish: true }, USER_ID, deps);
    expect(result).toMatchObject({ courseId: 'course-1', versionId: 'version-1', status: 'published' });
    expect(statements[0]).toBe('BEGIN');
    expect(statements).toContain('COMMIT');
    expect(statements.some(sql => sql.includes('UPDATE hr_learning_courses'))).toBe(true);
  });

  it('rolls back the course row when curriculum persistence fails', async () => {
    const { deps, statements } = dependencies({ failBlock: true });
    await expect(createCourseWithCurriculum({ ...course, publish: false }, USER_ID, deps)).rejects.toThrow('forced curriculum failure');
    expect(statements).toContain('ROLLBACK');
    expect(statements).not.toContain('COMMIT');
  });

  it('creates every generated course and path atomically', async () => {
    const { deps, statements } = dependencies();
    const result = await createLearningPathWithCourses({ title: 'New hire', description: 'Path', courses: [course, { ...course, metadata: { ...course.metadata, title: 'Safety 2' } }] }, USER_ID, deps);
    expect(result).toEqual({ pathId: 'path-1', courseIds: ['course-1', 'course-2'] });
    expect(statements.filter(sql => sql.includes('INSERT INTO hr_learning_courses'))).toHaveLength(2);
    expect(statements.filter(sql => sql === 'BEGIN')).toHaveLength(1);
    expect(statements.filter(sql => sql === 'COMMIT')).toHaveLength(1);
  });
});
