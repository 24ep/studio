"use client";

import {
  canCreateEvaluationLink,
  canViewEvaluationLinks,
  type SessionLikeUser,
} from "@/lib/permissions";
import type { Applicant } from "@/lib/types";

type EvaluationPermissionUser = (SessionLikeUser & { id?: string }) | null | undefined;

export function useFullApplicantEvaluationPermissions({
  applicant,
  sessionUser,
}: {
  applicant: Applicant | null;
  sessionUser: EvaluationPermissionUser;
}) {
  const canViewEvalLinks = canViewEvaluationLinks(sessionUser).canView;
  const canCreateEvalLink = (selectedApplicant: Applicant | null) =>
    canCreateEvaluationLink(
      sessionUser,
      selectedApplicant?.recruiterId,
      sessionUser?.id || "",
    ).canCreate;

  return {
    canCreateEvalLink,
    canOpenEvalActions: canViewEvalLinks || canCreateEvalLink(applicant),
    canViewEvalLinks,
  };
}
