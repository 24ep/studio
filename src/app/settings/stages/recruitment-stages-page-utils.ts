import type { DropResult } from '@hello-pangea/dnd';
import type { RecruitmentStage } from '@/lib/types';

export interface RecruitmentStageDeleteResult {
  ok: boolean;
  status: number;
  message: string | null;
}

export type RecruitmentStageDeleteDecision =
  | { type: 'deleted' }
  | { type: 'validation-error'; message: string }
  | { type: 'needs-replacement' }
  | { type: 'error'; message: string };

export function getRecruitmentStagesErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getStageSaveSuccessMessage(editingStage: RecruitmentStage | null) {
  return editingStage ? 'Stage updated successfully' : 'Stage created successfully';
}

export function resetReplacementStageState() {
  return {
    stageToDelete: null,
    replacementStageName: '',
  };
}

export function hasReplacementStageSelection(
  stage: RecruitmentStage | null,
  replacementStageName: string
): stage is RecruitmentStage {
  return Boolean(stage && replacementStageName);
}

export function getRecruitmentStageDeleteDecision(
  result: RecruitmentStageDeleteResult
): RecruitmentStageDeleteDecision {
  if (result.ok) {
    return { type: 'deleted' };
  }

  if (result.status === 400 && result.message) {
    return { type: 'validation-error', message: result.message };
  }

  if (result.status === 409) {
    return { type: 'needs-replacement' };
  }

  return {
    type: 'error',
    message: result.message || 'Failed to delete stage',
  };
}

export function reorderRecruitmentStages(
  stages: RecruitmentStage[],
  result: DropResult
) {
  if (!result.destination) {
    return null;
  }

  const items = Array.from(stages);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);

  const updatedStages = items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));

  return {
    stageIds: updatedStages.map((item) => item.id),
    stages: updatedStages,
  };
}
