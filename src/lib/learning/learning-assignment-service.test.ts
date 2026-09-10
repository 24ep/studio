import { describe, expect, it, vi } from 'vitest';
import { assignLearningBatch, type LearningAssignmentDependencies } from './learning-assignment-service';

const EMPLOYEE_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_2_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '44444444-4444-4444-8444-444444444444';
const COMPANY_ID = '55555555-5555-4555-8555-555555555555';

function deps(options?: { employeeCompany?: string | null; courseCount?: number; existingBatch?: boolean }) {
  const statements: string[] = [];
  const client = {
    query: vi.fn(async (sql: string, values?: unknown[]) => {
      statements.push(sql);
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('FROM hr_learning_assignment_batches') && sql.includes('idempotency_key')) {
        return options?.existingBatch
          ? { rows: [{ id: 'batch-existing', employee_id: EMPLOYEE_ID, course_ids: [COURSE_ID] }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (sql.includes('FROM hr_employees') && sql.includes('WHERE id=$1')) {
        return { rows: [{ id: EMPLOYEE_ID, user_id: USER_ID, company_id: options?.employeeCompany ?? COMPANY_ID }], rowCount: 1 };
      }
      if (sql.includes('FROM hr_learning_courses') && sql.includes("status='published'")) {
        const count = options?.courseCount ?? 2;
        return { rows: [{ id: COURSE_ID, current_version_id: 'v1' }, { id: COURSE_2_ID, current_version_id: 'v2' }].slice(0, count), rowCount: count };
      }
      if (sql.includes('INSERT INTO hr_learning_assignment_batches')) {
        expect(values).toEqual(expect.arrayContaining([EMPLOYEE_ID, 'path', 'New hire path', USER_ID, 'idem-1']));
        return { rows: [{ id: 'batch-new', employee_id: EMPLOYEE_ID, course_ids: [COURSE_ID, COURSE_2_ID] }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO hr_learning_enrollments')) {
        expect(sql).toContain("status=CASE WHEN hr_learning_enrollments.status='completed' THEN hr_learning_enrollments.status ELSE hr_learning_enrollments.status END");
        expect(sql).not.toContain('progress=0');
        return { rows: [{ id: 'enrollment' }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO hr_learning_activity_events')) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    }),
    release: vi.fn(),
  };
  const dependencies = {
    connect: vi.fn(async () => client),
    notify: vi.fn(async () => undefined),
  } as unknown as LearningAssignmentDependencies;
  return { dependencies, client, statements };
}

const input = {
  employeeId: EMPLOYEE_ID,
  courseIds: [COURSE_ID, COURSE_2_ID],
  sourceType: 'path' as const,
  sourceId: '66666666-6666-4666-8666-666666666666',
  sourceLabel: 'New hire path',
  dueDate: '2026-09-30',
  idempotencyKey: 'idem-1',
  actor: { userId: USER_ID, companyId: COMPANY_ID, isAdmin: false },
};

describe('assignLearningBatch', () => {
  it('rolls back the whole batch when any requested course is invalid', async () => {
    const { dependencies, statements } = deps({ courseCount: 1 });
    await expect(assignLearningBatch(input, dependencies)).rejects.toThrow('published and active');
    expect(statements).toContain('ROLLBACK');
    expect(statements.some(sql => sql.includes('INSERT INTO hr_learning_enrollments'))).toBe(false);
  });

  it('returns an existing idempotent batch without duplicate enrollments or notifications', async () => {
    const { dependencies, statements } = deps({ existingBatch: true });
    const result = await assignLearningBatch(input, dependencies);
    expect(result.id).toBe('batch-existing');
    expect(statements.some(sql => sql.includes('INSERT INTO hr_learning_enrollments'))).toBe(false);
    expect(dependencies.notify).not.toHaveBeenCalled();
  });

  it('rejects a target employee outside the manager company scope', async () => {
    const { dependencies, statements } = deps({ employeeCompany: '77777777-7777-4777-8777-777777777777' });
    await expect(assignLearningBatch(input, dependencies)).rejects.toThrow('company scope');
    expect(statements).toContain('ROLLBACK');
  });

  it('creates one atomic batch, preserves completed enrollment state, and notifies once after commit', async () => {
    const { dependencies, statements } = deps();
    const result = await assignLearningBatch(input, dependencies);
    expect(result.id).toBe('batch-new');
    expect(statements.filter(sql => sql.includes('INSERT INTO hr_learning_enrollments'))).toHaveLength(2);
    expect(statements.filter(sql => sql.includes('INSERT INTO hr_learning_activity_events'))).toHaveLength(2);
    expect(statements.indexOf('COMMIT')).toBeGreaterThan(statements.findIndex(sql => sql.includes('INSERT INTO hr_learning_activity_events')));
    expect(dependencies.notify).toHaveBeenCalledTimes(1);
  });
});
