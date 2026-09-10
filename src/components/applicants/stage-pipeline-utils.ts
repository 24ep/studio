import type { TransitionRecord } from '@/lib/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function groupTransitionRecordsByStage(
  transitionHistory: TransitionRecord[] | null | undefined
) {
  const stageToRecords: Record<string, TransitionRecord[]> = {};
  const safeTransitionHistory = Array.isArray(transitionHistory) ? transitionHistory : [];

  safeTransitionHistory.forEach(record => {
    if (!stageToRecords[record.stage]) {
      stageToRecords[record.stage] = [];
    }

    stageToRecords[record.stage].push(record);
  });

  return stageToRecords;
}

export function formatStageDurationFromDays(days: number) {
  if (!Number.isFinite(days) || days <= 0) {
    return '';
  }

  if (days === 1) {
    return '1 day';
  }

  if (days < 7) {
    return `${days} days`;
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''}`;
}

export function getDefaultStageDurationDays(stageIndex: number) {
  if (stageIndex === 0) return 3;
  if (stageIndex === 1) return 5;
  if (stageIndex === 2) return 7;
  if (stageIndex === 3) return 10;

  return 14;
}

function getValidDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNextStageRecordDate(
  transitionHistory: readonly TransitionRecord[],
  stageId: string,
  stageDate: Date
) {
  const nextStageRecord = transitionHistory
    .filter(record => record.stage !== stageId)
    .find(record => {
      const recordDate = getValidDate(record.date);
      return recordDate ? recordDate > stageDate : false;
    });

  return getValidDate(nextStageRecord?.date);
}

export function getActualStageDurationText({
  stageId,
  isCurrent,
  latestRecord,
  transitionHistory,
  now = new Date(),
}: {
  stageId: string;
  isCurrent: boolean;
  latestRecord: TransitionRecord | null;
  transitionHistory: readonly TransitionRecord[];
  now?: Date;
}) {
  const stageDate = getValidDate(latestRecord?.date);
  if (!stageDate) {
    return '';
  }

  const endDate = isCurrent
    ? now
    : getNextStageRecordDate(transitionHistory, stageId, stageDate);

  if (!endDate) {
    return '';
  }

  const diffDays = Math.ceil(Math.abs(endDate.getTime() - stageDate.getTime()) / MS_PER_DAY);
  return formatStageDurationFromDays(diffDays);
}

export function getStageTimelineDurationText({
  stageId,
  stageIndex,
  isCompleted,
  isCurrent,
  latestRecord,
  transitionHistory,
  now = new Date(),
}: {
  stageId: string;
  stageIndex: number;
  isCompleted: boolean;
  isCurrent: boolean;
  latestRecord: TransitionRecord | null;
  transitionHistory: readonly TransitionRecord[];
  now?: Date;
}) {
  const actualDuration = getActualStageDurationText({
    stageId,
    isCurrent,
    latestRecord,
    transitionHistory,
    now,
  });

  if (actualDuration) {
    return actualDuration;
  }

  if (latestRecord?.date) {
    return '';
  }

  if (!isCompleted && !isCurrent) {
    return formatStageDurationFromDays(getDefaultStageDurationDays(stageIndex));
  }

  return '';
}

export function getStagePopoverDurationText({
  stageId,
  isCompleted,
  isCurrent,
  latestRecord,
  transitionHistory,
  now = new Date(),
}: {
  stageId: string;
  isCompleted: boolean;
  isCurrent: boolean;
  latestRecord: TransitionRecord | null;
  transitionHistory: readonly TransitionRecord[];
  now?: Date;
}) {
  if (!isCompleted && !isCurrent) {
    return '';
  }

  return getActualStageDurationText({
    stageId,
    isCurrent,
    latestRecord,
    transitionHistory,
    now,
  });
}
