import { describe, expect, it, vi } from 'vitest';
import {
  getLearningCatalog,
  getLearningSelfServiceContext,
  type LearningSelfServiceQueryExecutor,
} from './learning-self-service';

const EMPLOYEE_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_COURSE_ID = '33333333-3333-4333-8333-333333333333';

function executor() {
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    if (sql.includes('FROM hr_learning_enrollments')) {
      expect(values).toEqual([EMPLOYEE_ID]);
      return { rows: [{
        id: 'enrollment-1',
        course_id: COURSE_ID,
        course_title: 'Safety basics',
        course_category: 'Compliance',
        course_description: 'Required safety learning',
        status: 'in_progress',
        progress: 45,
        due_date: '2026-09-01',
        completed_at: null,
        current_lesson_id: null,
        course_version_id: '44444444-4444-4444-8444-444444444444',
      }], rowCount: 1 };
    }
    if (sql.includes('FROM hr_learning_paths')) {
      return { rows: [{ id: 'path-1', title: 'New hire path', description: null, status: 'published', course_ids: [COURSE_ID, OTHER_COURSE_ID] }], rowCount: 1 };
    }
    if (sql.includes('FROM hr_certifications')) {
      expect(values).toEqual([EMPLOYEE_ID]);
      return { rows: [{ id: 'cert-1', name: 'First Aid', issuer: 'Issuer', status: 'active', issued_at: '2026-01-01', expires_at: null, verification_url: null }], rowCount: 1 };
    }
    if (sql.includes('FROM hr_learning_courses')) {
      expect(sql).toContain("c.status = 'published'");
      expect(sql).toContain('c.is_active = true');
      return { rows: [{
        id: COURSE_ID,
        title: 'Safety basics',
        category: 'Compliance',
        description: 'Required safety learning',
        duration_hours: 1,
        is_required: true,
        cover_image_url: null,
        enrollment_id: 'enrollment-1',
        enrollment_status: 'in_progress',
        enrollment_progress: 45,
        due_date: '2026-09-01',
      }], rowCount: 1 };
    }
    throw new Error(`Unexpected query: ${sql}`);
  });
  return {
    db: { query: query as unknown as LearningSelfServiceQueryExecutor['query'] } as LearningSelfServiceQueryExecutor,
    query,
  };
}

describe('Learning learner-safe reads', () => {
  it('returns only the linked employee learning context and derives path progress from own enrollments', async () => {
    const { db, query } = executor();
    const context = await getLearningSelfServiceContext(EMPLOYEE_ID, db);

    expect(context.available).toBe(true);
    expect(context.employeeId).toBe(EMPLOYEE_ID);
    expect(context.enrollments).toEqual([expect.objectContaining({ courseId: COURSE_ID, status: 'in_progress', progress: 45 })]);
    expect(context.certificates).toEqual([expect.objectContaining({ name: 'First Aid' })]);
    expect(context.paths).toEqual([expect.objectContaining({ id: 'path-1', assignedCourseCount: 1, totalCourseCount: 2 })]);

    const queries = query.mock.calls.map(call => String(call[0]));
    expect(queries.filter(sql => sql.includes('hr_learning_enrollments'))).toHaveLength(1);
    expect(queries.filter(sql => sql.includes('hr_certifications'))).toHaveLength(1);
  });

  it('returns an explicit unavailable context without querying workforce data when no employee is linked', async () => {
    const { db, query } = executor();
    const context = await getLearningSelfServiceContext(null, db);

    expect(context).toEqual({ available: false, employeeId: null, enrollments: [], paths: [], certificates: [] });
    expect(query).not.toHaveBeenCalled();
  });

  it('returns only published active catalog courses', async () => {
    const { db, query } = executor();
    const catalog = await getLearningCatalog(EMPLOYEE_ID, db);

    expect(catalog).toEqual([expect.objectContaining({ id: COURSE_ID, status: 'in_progress', progress: 45 })]);
    const sql = String(query.mock.calls[0][0]);
    expect(sql).toContain("c.status = 'published'");
    expect(sql).toContain('c.is_active = true');
  });

  it('decorates catalog rows only from the linked employee enrollment', async () => {
    const { db, query } = executor();
    await getLearningCatalog(EMPLOYEE_ID, db);

    const [sql, values] = query.mock.calls[0];
    expect(String(sql)).toContain('e.employee_id = $1::uuid');
    expect(values).toEqual([EMPLOYEE_ID]);
  });

  it('never widens anonymous catalog decoration to another employee', async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      expect(values).toEqual([null]);
      expect(sql).toContain('e.employee_id = $1::uuid');
      return { rows: [{ id: COURSE_ID, title: 'Published course', category: null, description: null, duration_hours: null, is_required: false, cover_image_url: null, enrollment_id: null, enrollment_status: null, enrollment_progress: null, due_date: null }], rowCount: 1 };
    });
    const db = { query: query as unknown as LearningSelfServiceQueryExecutor['query'] } as LearningSelfServiceQueryExecutor;

    const catalog = await getLearningCatalog(null, db);
    expect(catalog[0]).toMatchObject({ enrollmentId: null, status: null, progress: 0 });
  });
});
