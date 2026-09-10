import { useMemo } from 'react';
import {
  canEditEvaluationAttachments,
  canEditEvaluationScores,
  canRemoveEvaluationInterviewer,
  canResetApplicantEvaluation,
} from './utils';
import type { EvaluationPermissionUser } from './evaluate-permission-utils';

interface UseEvaluationPermissionsInput {
  sessionUser: EvaluationPermissionUser;
  applicantRecruiterId: string | null;
}

export function useEvaluationPermissions({
  sessionUser,
  applicantRecruiterId,
}: UseEvaluationPermissionsInput) {
  const canEditScores = useMemo(
    () => canEditEvaluationScores(sessionUser, applicantRecruiterId),
    [sessionUser, applicantRecruiterId]
  );
  const canEditAttachments = useMemo(
    () => canEditEvaluationAttachments(sessionUser, applicantRecruiterId),
    [sessionUser, applicantRecruiterId]
  );
  const canResetEvaluation = useMemo(
    () => canResetApplicantEvaluation(sessionUser),
    [sessionUser]
  );
  const canRemoveInterviewer = useMemo(
    () => canRemoveEvaluationInterviewer(sessionUser),
    [sessionUser]
  );

  return {
    canEditScores,
    canEditAttachments,
    canEditRemark: canEditAttachments,
    canResetEvaluation,
    canRemoveInterviewer,
  };
}
