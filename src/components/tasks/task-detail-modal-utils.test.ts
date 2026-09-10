import { describe, expect, it } from 'vitest';
import {
  getTaskPriorityColor,
  isTaskDetailOverdue,
  isTaskPriority,
  TASK_PRIORITIES,
} from './task-detail-modal-utils';

describe('task-detail-modal-utils', () => {
  it('recognizes the supported task priorities', () => {
    expect(TASK_PRIORITIES.every(isTaskPriority)).toBe(true);
    expect(isTaskPriority('blocked')).toBe(false);
    expect(isTaskPriority('')).toBe(false);
  });

  it('returns a fallback class for unknown priorities', () => {
    expect(getTaskPriorityColor('urgent')).toContain('bg-red-100');
    expect(getTaskPriorityColor('unknown')).toContain('bg-gray-100');
    expect(getTaskPriorityColor()).toContain('bg-gray-100');
  });

  it('treats earlier dates as overdue but keeps today and future dates current', () => {
    const now = new Date('2026-06-09T15:30:00Z');

    expect(isTaskDetailOverdue('2026-06-08', now)).toBe(true);
    expect(isTaskDetailOverdue('2026-06-09', now)).toBe(false);
    expect(isTaskDetailOverdue('2026-06-10', now)).toBe(false);
    expect(isTaskDetailOverdue(undefined, now)).toBe(false);
  });
});
