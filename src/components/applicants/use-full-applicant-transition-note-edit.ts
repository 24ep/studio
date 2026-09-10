"use client";

import {
  fetchApplicantTransitions,
  updateApplicantTransitionNote,
} from "./full-applicant-detail-api";

export function useFullApplicantTransitionNoteEdit(applicantId: string) {
  return async (transitionId: string, newNote: string) => {
    await updateApplicantTransitionNote(transitionId, newNote);
    await fetchApplicantTransitions(applicantId);
  };
}
