import { describe, expect, it } from 'vitest';

import type { TransitionRecord } from '@/lib/types';
import {
  getStageDetailActorName,
  getStageDetailEditDateValue,
  getStageDetailRecordCountLabel,
  getStageDetailTimestampLabel,
} from './stage-detail-modal-utils';

function transitionRecord(input: Partial<TransitionRecord>): TransitionRecord {
  return {
    id: input.id ?? 'transition-1',
    applicantId: input.applicantId ?? 'applicant-1',
    positionId: input.positionId ?? null,
    date: input.date ?? '',
    stage: input.stage ?? 'Interview',
    notes: input.notes,
    actingUserId: input.actingUserId ?? null,
    actingUserName: input.actingUserName,
  };
}

describe('stage detail modal utilities', () => {
  it('formats transition record counts', () => {
    expect(getStageDetailRecordCountLabel(1)).toBe('1 transition record for this stage');
    expect(getStageDetailRecordCountLabel(2)).toBe('2 transition records for this stage');
  });

  it('builds datetime-local edit values from record or fallback dates', () => {
    expect(getStageDetailEditDateValue(
      transitionRecord({ date: '2026-06-09T08:30:00.000Z' })
    )).toBe('2026-06-09T08:30');

    expect(getStageDetailEditDateValue(
      transitionRecord({ date: '' }),
      new Date('2026-06-10T09:45:00.000Z')
    )).toBe('2026-06-10T09:45');
  });

  it('falls back display metadata when transition fields are missing', () => {
    expect(getStageDetailActorName(transitionRecord({ actingUserName: 'Ada' }))).toBe('Ada');
    expect(getStageDetailActorName(transitionRecord({ actingUserName: undefined }))).toBe('Unknown');
    expect(getStageDetailTimestampLabel(transitionRecord({ date: '' }))).toBe('Unknown time');
  });
});
