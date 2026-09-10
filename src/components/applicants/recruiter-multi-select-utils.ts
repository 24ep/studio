import type { RecruiterMultiSelectOption } from './recruiter-multi-select-types';

export const SELECT_ALL_RECRUITER_ID = 'select-all';
export const UNASSIGNED_RECRUITER_ID = 'unassigned';

export function filterRecruitersBySearch(
  recruiters: RecruiterMultiSelectOption[],
  searchTerm: string
) {
  const normalizedSearch = searchTerm.toLowerCase();
  return recruiters.filter(recruiter =>
    recruiter.name.toLowerCase().includes(normalizedSearch)
  );
}

export function getSelectedRecruiters(
  recruiters: RecruiterMultiSelectOption[],
  selectedIds: Set<string>
) {
  return recruiters.filter(recruiter => selectedIds.has(recruiter.id));
}

export function toggleRecruiterSelection(selectedIds: Set<string>, recruiterId: string) {
  const nextSelected = new Set(selectedIds);

  if (recruiterId === SELECT_ALL_RECRUITER_ID) {
    return toggleExclusiveSelection(nextSelected, SELECT_ALL_RECRUITER_ID);
  }

  if (recruiterId === UNASSIGNED_RECRUITER_ID) {
    return toggleExclusiveSelection(nextSelected, UNASSIGNED_RECRUITER_ID);
  }

  if (nextSelected.has(recruiterId)) {
    nextSelected.delete(recruiterId);
  } else {
    nextSelected.delete(SELECT_ALL_RECRUITER_ID);
    nextSelected.delete(UNASSIGNED_RECRUITER_ID);
    nextSelected.add(recruiterId);
  }

  return nextSelected;
}

export function removeRecruiterSelection(selectedIds: Set<string>, recruiterId: string) {
  const nextSelected = new Set(selectedIds);
  nextSelected.delete(recruiterId);
  return nextSelected;
}

function toggleExclusiveSelection(selectedIds: Set<string>, recruiterId: string) {
  if (selectedIds.has(recruiterId)) {
    selectedIds.delete(recruiterId);
  } else {
    selectedIds.clear();
    selectedIds.add(recruiterId);
  }

  return selectedIds;
}
