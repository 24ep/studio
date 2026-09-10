import type { TransitionRecord } from "@/lib/types";

export function formatRecruitmentPipelineDuration(days: number) {
  if (days === 1) {
    return "1 day";
  }

  if (days < 7) {
    return `${days} days`;
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""}`;
}

function getValidTransitionDate(date: string | undefined) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function findNextStageRecord({
  stageDate,
  stageId,
  transitionHistory,
}: {
  stageDate: Date;
  stageId: string;
  transitionHistory: TransitionRecord[];
}) {
  return transitionHistory
    .filter((record) => record.stage !== stageId)
    .find((record) => {
      const recordDate = getValidTransitionDate(record.date);
      return Boolean(recordDate && recordDate > stageDate);
    });
}

function getRecruitmentPipelineEndDate({
  isCurrent,
  stageDate,
  stageId,
  transitionHistory,
  now,
}: {
  isCurrent: boolean;
  stageDate: Date;
  stageId: string;
  transitionHistory: TransitionRecord[];
  now: Date;
}) {
  if (isCurrent) {
    return now;
  }

  const nextStageRecord = findNextStageRecord({ stageDate, stageId, transitionHistory });
  return getValidTransitionDate(nextStageRecord?.date);
}

function getDiffDays(startDate: Date, endDate: Date) {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRecruitmentPipelineDurationLabel({
  isActuallyCompleted,
  isCurrent,
  isSkipped,
  latestRecord,
  stageId,
  transitionHistory,
  now = new Date(),
}: {
  isActuallyCompleted: boolean;
  isCurrent: boolean;
  isSkipped: boolean;
  latestRecord: TransitionRecord | null;
  stageId: string;
  transitionHistory: TransitionRecord[];
  now?: Date;
}) {
  if ((!isActuallyCompleted && !isCurrent) || isSkipped) {
    return "";
  }

  const stageDate = getValidTransitionDate(latestRecord?.date);
  if (!stageDate) {
    return "";
  }

  const endDate = getRecruitmentPipelineEndDate({
    isCurrent,
    stageDate,
    stageId,
    transitionHistory,
    now,
  });

  return endDate ? formatRecruitmentPipelineDuration(getDiffDays(stageDate, endDate)) : "";
}
