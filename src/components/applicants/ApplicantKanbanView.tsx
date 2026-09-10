// src/components/Applicants/ApplicantKanbanView.tsx
"use client";

import { ApplicantFlexibleKanbanContent } from './ApplicantFlexibleKanbanContent';
import {
  ApplicantKanbanEmptyState,
  ApplicantKanbanSkeletonLoading,
} from './ApplicantKanbanViewStates';
import type { ApplicantKanbanViewProps } from './ApplicantKanbanViewTypes';

export { MultiRecruiterKanbanView } from './ApplicantMultiRecruiterKanbanView';
export { HorizontalStageKanbanView } from './ApplicantHorizontalStageKanbanView';
export { SingleRowApplicantView } from './ApplicantSingleRowApplicantView';
export { SingleRowKanbanView } from './ApplicantSingleRowKanbanView';

export function ApplicantKanbanView({
  applicants,
  statuses,
  recruiters,
  onMoveApplicant,
  onCardClick,
  showAddButton = true,
  rowField = 'status',
  columnField = 'none',
  visibleFields = ['name', 'email', 'status', 'fitScore'],
  visibleRowValues = [],
  visibleColumnValues = [],
  isLoading = false,
}: ApplicantKanbanViewProps) {
  if (isLoading) return <ApplicantKanbanSkeletonLoading />;
  if (applicants.length === 0) return <ApplicantKanbanEmptyState />;

  return (
    <FlexibleKanbanView
      applicants={applicants}
      statuses={statuses}
      recruiters={recruiters}
      onMoveApplicant={onMoveApplicant}
      onCardClick={onCardClick}
      showAddButton={showAddButton}
      rowField={rowField}
      columnField={columnField}
      visibleFields={visibleFields}
      visibleRowValues={visibleRowValues}
      visibleColumnValues={visibleColumnValues}
      isLoading={isLoading}
    />
  );
}

export function FlexibleKanbanView(props: ApplicantKanbanViewProps) {
  return <ApplicantFlexibleKanbanContent {...props} />;
}
