import { describe, expect, it } from 'vitest';

import type { TransitionRecord } from '@/lib/types';
import {
  formatStageDurationFromDays,
  getDefaultStageDurationDays,
  getStagePopoverDurationText,
  getStageTimelineDurationText,
  groupTransitionRecordsByStage,
} from './stage-pipeline-utils';

function transition(overrides: Partial<TransitionRecord>): TransitionRecord {
  return {
    id: 'transition-1',
    stage: 'screening',
    date: '2026-01-01T00:00:00.000Z',
    notes: null,
    actingUserName: 'Admin',
    ...overrides,
  } as TransitionRecord;
}

describe('stage pipeline utilities', () => {
  it('groups transition records by stage', () => {
    expect(
      groupTransitionRecordsByStage([
        transition({ id: '1', stage: 'screening' }),
        transition({ id: '2', stage: 'interview' }),
        transition({ id: '3', stage: 'screening' }),
      ])
    ).toMatchObject({
      screening: [{ id: '1' }, { id: '3' }],
      interview: [{ id: '2' }],
    });

    expect(groupTransitionRecordsByStage(null)).toEqual({});
  });

  it('formats stage durations consistently', () => {
    expect(formatStageDurationFromDays(1)).toBe('1 day');
    expect(formatStageDurationFromDays(6)).toBe('6 days');
    expect(formatStageDurationFromDays(14)).toBe('2 weeks');
    expect(formatStageDurationFromDays(60)).toBe('2 months');
    expect(formatStageDurationFromDays(Number.NaN)).toBe('');
  });

  it('uses expected future-stage timeline durations', () => {
    expect(getDefaultStageDurationDays(0)).toBe(3);
    expect(getDefaultStageDurationDays(1)).toBe(5);
    expect(getDefaultStageDurationDays(2)).toBe(7);
    expect(getDefaultStageDurationDays(3)).toBe(10);
    expect(getDefaultStageDurationDays(4)).toBe(14);

    expect(
      getStageTimelineDurationText({
        stageId: 'offer',
        stageIndex: 4,
        isCompleted: false,
        isCurrent: false,
        latestRecord: null,
        transitionHistory: [],
      })
    ).toBe('2 weeks');

    expect(
      getStageTimelineDurationText({
        stageId: 'offer',
        stageIndex: 4,
        isCompleted: false,
        isCurrent: false,
        latestRecord: transition({ stage: 'offer' }),
        transitionHistory: [],
      })
    ).toBe('');
  });

  it('calculates actual completed and current stage durations', () => {
    const screening = transition({
      id: 'screening',
      stage: 'screening',
      date: '2026-01-01T00:00:00.000Z',
    });
    const interview = transition({
      id: 'interview',
      stage: 'interview',
      date: '2026-01-08T00:00:00.000Z',
    });

    expect(
      getStageTimelineDurationText({
        stageId: 'screening',
        stageIndex: 0,
        isCompleted: true,
        isCurrent: false,
        latestRecord: screening,
        transitionHistory: [screening, interview],
      })
    ).toBe('1 week');

    expect(
      getStagePopoverDurationText({
        stageId: 'interview',
        isCompleted: false,
        isCurrent: true,
        latestRecord: interview,
        transitionHistory: [screening, interview],
        now: new Date('2026-01-10T00:00:00.000Z'),
      })
    ).toBe('2 days');
  });

  it('hides popover duration for future stages', () => {
    expect(
      getStagePopoverDurationText({
        stageId: 'offer',
        isCompleted: false,
        isCurrent: false,
        latestRecord: null,
        transitionHistory: [],
      })
    ).toBe('');
  });
});
