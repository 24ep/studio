import { describe, expect, it, vi } from 'vitest';
import { assertEnrollmentContentAccess, type LearningQueryExecutor } from './learning-integrity';

const IDS = {
  enrollment: '11111111-1111-4111-8111-111111111111',
  employee: '22222222-2222-4222-8222-222222222222',
  course: '33333333-3333-4333-8333-333333333333',
  version: '44444444-4444-4444-8444-444444444444',
  lesson: '55555555-5555-4555-8555-555555555555',
  block: '66666666-6666-4666-8666-666666666666',
  otherBlock: '77777777-7777-4777-8777-777777777777',
};

function accessRow(overrides: Record<string, unknown> = {}) {
  return {
    enrollment_id: IDS.enrollment,
    course_id: IDS.course,
    course_version_id: IDS.version,
    enrollment_status: 'in_progress',
    lesson_id: IDS.lesson,
    block_id: IDS.block,
    block_type: 'text',
    block_content: { body: 'Safe content' },
    passing_score: 80,
    max_attempts: 3,
    ...overrides,
  };
}

function executorFor(row: Record<string, unknown> | null): LearningQueryExecutor {
  return {
    query: vi.fn().mockResolvedValue({ rows: row ? [row] : [], rowCount: row ? 1 : 0 }),
  };
}

describe('assertEnrollmentContentAccess', () => {
  it('validates lessons through the enrollment course version', async () => {
    const executor = executorFor(accessRow({ block_id: null, block_type: null, block_content: null }));

    const access = await assertEnrollmentContentAccess({
      enrollmentId: IDS.enrollment,
      employeeId: IDS.employee,
      lessonId: IDS.lesson,
    }, executor);

    expect(access).toMatchObject({
      enrollmentId: IDS.enrollment,
      courseId: IDS.course,
      courseVersionId: IDS.version,
      lessonId: IDS.lesson,
      enrollmentStatus: 'in_progress',
    });

    const sql = vi.mocked(executor.query).mock.calls[0][0];
    expect(sql).toContain('hr_learning_course_sections');
    expect(sql).toContain('s.version_id = e.course_version_id');
    expect(sql).toContain('hr_learning_lessons');
    expect(sql).toContain('l.section_id = s.id');
  });

  it('validates a block through the validated lesson and version', async () => {
    const executor = executorFor(accessRow());

    const access = await assertEnrollmentContentAccess({
      enrollmentId: IDS.enrollment,
      employeeId: IDS.employee,
      lessonId: IDS.lesson,
      blockId: IDS.block,
    }, executor);

    expect(access).toMatchObject({ blockId: IDS.block, blockType: 'text' });
    const sql = vi.mocked(executor.query).mock.calls[0][0];
    expect(sql).toContain('hr_learning_content_blocks');
    expect(sql).toContain('b.lesson_id = l.id');
  });

  it('rejects a lesson that is not reachable through the enrollment version', async () => {
    const executor = executorFor(null);

    await expect(assertEnrollmentContentAccess({
      enrollmentId: IDS.enrollment,
      employeeId: IDS.employee,
      lessonId: IDS.lesson,
    }, executor)).rejects.toThrow('Learning content is not part of this enrollment.');
  });

  it('rejects a block that belongs to another lesson or course version', async () => {
    const executor: LearningQueryExecutor = {
      query: vi.fn(async (_sql, values) => ({
        rows: values?.[3] === IDS.otherBlock ? [] : [accessRow()],
        rowCount: values?.[3] === IDS.otherBlock ? 0 : 1,
      })),
    };

    await expect(assertEnrollmentContentAccess({
      enrollmentId: IDS.enrollment,
      employeeId: IDS.employee,
      lessonId: IDS.lesson,
      blockId: IDS.otherBlock,
    }, executor)).rejects.toThrow('Learning content is not part of this enrollment.');
  });

  it('can validate ownership of completed enrollment content without making it mutable', async () => {
    const executor = executorFor(accessRow({ enrollment_status: 'completed' }));

    const access = await assertEnrollmentContentAccess({
      enrollmentId: IDS.enrollment,
      employeeId: IDS.employee,
      lessonId: IDS.lesson,
      blockId: IDS.block,
    }, executor);

    expect(access.enrollmentStatus).toBe('completed');
  });
});
