import type { RecruitmentStage } from "@/lib/types";

export const STATUS_SELECT_ALL_ID = 'select-all';

export function filterStatusStages(stages: RecruitmentStage[], searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return stages;
  }

  return stages.filter((stage) =>
    stage.name.toLowerCase().includes(normalizedSearch)
  );
}

export function getSelectedStatusStages(stages: RecruitmentStage[], selectedIds: Set<string>) {
  return stages.filter((stage) => selectedIds.has(stage.id));
}

export function toggleStatusSelection(selectedIds: Set<string>, stageId: string) {
  const nextSelected = new Set(selectedIds);

  if (stageId === STATUS_SELECT_ALL_ID) {
    if (nextSelected.has(STATUS_SELECT_ALL_ID)) {
      nextSelected.delete(STATUS_SELECT_ALL_ID);
      return nextSelected;
    }

    nextSelected.clear();
    nextSelected.add(STATUS_SELECT_ALL_ID);
    return nextSelected;
  }

  if (nextSelected.has(stageId)) {
    nextSelected.delete(stageId);
    return nextSelected;
  }

  nextSelected.delete(STATUS_SELECT_ALL_ID);
  nextSelected.add(stageId);
  return nextSelected;
}

export function removeStatusSelection(selectedIds: Set<string>, stageId: string) {
  const nextSelected = new Set(selectedIds);
  nextSelected.delete(stageId);
  return nextSelected;
}

export function getApplicantCountBadgeValue(
  applicantCounts: Record<string, number>,
  stageId: string
) {
  const count = applicantCounts[stageId] ?? 0;
  return count > 0 ? count : null;
}
