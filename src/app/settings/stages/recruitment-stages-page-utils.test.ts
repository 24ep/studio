import { describe, expect, it } from 'vitest';
import type { DropResult } from '@hello-pangea/dnd';
import type { RecruitmentStage } from '@/lib/types';
import {
  getRecruitmentStageDeleteDecision,
  getRecruitmentStagesErrorMessage,
  getStageSaveSuccessMessage,
  hasReplacementStageSelection,
  reorderRecruitmentStages,
  resetReplacementStageState,
} from './recruitment-stages-page-utils';

const stages = [
  { id: 'stage-1', name: 'Applied' },
  { id: 'stage-2', name: 'Screening' },
  { id: 'stage-3', name: 'Offer' },
] as RecruitmentStage[];

function dragResult(sourceIndex: number, destinationIndex: number | null): DropResult {
  return {
    draggableId: stages[sourceIndex].id,
    type: 'DEFAULT',
    source: { droppableId: 'stages-list', index: sourceIndex },
    destination: destinationIndex === null ? null : { droppableId: 'stages-list', index: destinationIndex },
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
  };
}

describe('recruitment-stages-page-utils', () => {
  it('reorders stages and produces stage ids for persistence', () => {
    expect(reorderRecruitmentStages(stages, dragResult(2, 0))).toEqual({
      stageIds: ['stage-3', 'stage-1', 'stage-2'],
      stages: [
        { id: 'stage-3', name: 'Offer', sort_order: 1 },
        { id: 'stage-1', name: 'Applied', sort_order: 2 },
        { id: 'stage-2', name: 'Screening', sort_order: 3 },
      ],
    });
  });

  it('ignores drags without a destination and resets replacement state', () => {
    expect(reorderRecruitmentStages(stages, dragResult(1, null))).toBeNull();
    expect(resetReplacementStageState()).toEqual({
      stageToDelete: null,
      replacementStageName: '',
    });
  });

  it('normalizes unknown errors', () => {
    expect(getRecruitmentStagesErrorMessage(new Error('Nope'))).toBe('Nope');
    expect(getRecruitmentStagesErrorMessage('plain')).toBe('plain');
  });

  it('builds save success messages from edit state', () => {
    expect(getStageSaveSuccessMessage(stages[0])).toBe('Stage updated successfully');
    expect(getStageSaveSuccessMessage(null)).toBe('Stage created successfully');
  });

  it('detects whether replacement deletion can be confirmed', () => {
    expect(hasReplacementStageSelection(stages[0], 'Screening')).toBe(true);
    expect(hasReplacementStageSelection(stages[0], '')).toBe(false);
    expect(hasReplacementStageSelection(null, 'Screening')).toBe(false);
  });

  it('classifies delete results for the controller', () => {
    expect(getRecruitmentStageDeleteDecision({ ok: true, status: 200, message: null })).toEqual({
      type: 'deleted',
    });
    expect(getRecruitmentStageDeleteDecision({ ok: false, status: 400, message: 'Stage is required' })).toEqual({
      type: 'validation-error',
      message: 'Stage is required',
    });
    expect(getRecruitmentStageDeleteDecision({ ok: false, status: 409, message: 'Has applicants' })).toEqual({
      type: 'needs-replacement',
    });
    expect(getRecruitmentStageDeleteDecision({ ok: false, status: 500, message: null })).toEqual({
      type: 'error',
      message: 'Failed to delete stage',
    });
  });
});
