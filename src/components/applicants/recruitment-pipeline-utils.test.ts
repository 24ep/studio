import { describe, expect, it } from 'vitest';

import type { RecruitmentStage, TransitionRecord } from '@/lib/types';
import {
  buildRecruitmentPipelineStages,
  formatRecruitmentPipelineDuration,
  getRecruitmentPipelineDurationLabel,
  getRecruitmentPipelineLineGradient,
  groupRecruitmentTransitionsByStage,
} from './recruitment-pipeline-utils';

const stages = [
  { id: 'applied', name: 'Applied', color_complete: '#00aa00' },
  { id: 'screening', name: 'Screening' },
  { id: 'offer', name: 'Offer' },
] as RecruitmentStage[];

const transitionHistory = [
  { stage: 'applied', date: '2026-01-01T00:00:00Z' },
  { stage: 'offer', date: '2026-01-15T00:00:00Z' },
] as TransitionRecord[];

describe('recruitment pipeline utilities', () => {
  it('groups transition records by stage defensively', () => {
    expect(groupRecruitmentTransitionsByStage(null)).toEqual({});
    expect(groupRecruitmentTransitionsByStage(transitionHistory)).toEqual({
      applied: [transitionHistory[0]],
      offer: [transitionHistory[1]],
    });
  });

  it('formats stage durations with day, week, and month labels', () => {
    expect(formatRecruitmentPipelineDuration(1)).toBe('1 day');
    expect(formatRecruitmentPipelineDuration(6)).toBe('6 days');
    expect(formatRecruitmentPipelineDuration(14)).toBe('2 weeks');
    expect(formatRecruitmentPipelineDuration(61)).toBe('2 months');
  });

  it('builds duration labels for current and completed stages', () => {
    expect(getRecruitmentPipelineDurationLabel({
      isActuallyCompleted: true,
      isCurrent: false,
      isSkipped: false,
      latestRecord: transitionHistory[0],
      stageId: 'applied',
      transitionHistory,
    })).toBe('2 weeks');

    expect(getRecruitmentPipelineDurationLabel({
      isActuallyCompleted: false,
      isCurrent: true,
      isSkipped: false,
      latestRecord: transitionHistory[1],
      stageId: 'offer',
      transitionHistory,
      now: new Date('2026-01-20T00:00:00Z'),
    })).toBe('5 days');

    expect(getRecruitmentPipelineDurationLabel({
      isActuallyCompleted: true,
      isCurrent: false,
      isSkipped: true,
      latestRecord: transitionHistory[0],
      stageId: 'applied',
      transitionHistory,
    })).toBe('');
  });

  it('builds stage view state and line gradients', () => {
    const stageToRecords = groupRecruitmentTransitionsByStage(transitionHistory);
    const { currentStageIndex, stageViews } = buildRecruitmentPipelineStages({
      currentStatus: 'offer',
      stages,
      stageToRecords,
      transitionHistory,
    });

    expect(currentStageIndex).toBe(2);
    expect(stageViews.map(view => ({
      id: view.stage.id,
      statusLabel: view.statusLabel,
      isSkipped: view.isSkipped,
      title: view.title,
    }))).toEqual([
      {
        id: 'applied',
        statusLabel: 'Completed Stage',
        isSkipped: false,
        title: 'Applied - Completed stage (1 update)',
      },
      {
        id: 'screening',
        statusLabel: 'Skipped Stage',
        isSkipped: true,
        title: 'Screening - Skipped stage',
      },
      {
        id: 'offer',
        statusLabel: 'Current Stage',
        isSkipped: false,
        title: 'Offer - Current stage (1 update)',
      },
    ]);

    expect(getRecruitmentPipelineLineGradient({
      currentStageIndex,
      stages,
      stageToRecords,
    })).toBe('linear-gradient(to right, #00aa00 0%, #00aa00 50%, #9ca3af 50%, #9ca3af 100%, #d1d5db 100%, #d1d5db 150%)');
  });
});
