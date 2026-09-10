"use client";

import {
  BulkRecruiterAssignmentDialog,
  BulkStatusChangeDialog,
  CoreApplicantsPageModals,
} from './ApplicantsPageModalsParts';
import type { ApplicantsPageModalsProps } from './ApplicantsPageModalsTypes';

export function ApplicantsPageModals(props: ApplicantsPageModalsProps) {
  return (
    <>
      <CoreApplicantsPageModals {...props} />
      <BulkStatusChangeDialog {...props} />
      <BulkRecruiterAssignmentDialog {...props} />
    </>
  );
}
