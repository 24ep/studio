import type { validateApplicantHiringStatusWithClient } from './bulk-action-route-utils';

export type ApplicantPermissionRow = {
  id: string;
  statusId?: string | null;
  positionId?: string | null;
  recruiterId?: string | null;
};

export type HeadcountValidationResult = {
  applicantId: string;
  validation: Awaited<ReturnType<typeof validateApplicantHiringStatusWithClient>>;
  willAutoAssign: boolean;
};

export type RecruitmentStageRow = {
  id: string;
  name: string;
};

export type StatusUpdatePreparation = {
  headcountValidationResults: HeadcountValidationResult[];
  applicantsToUpdate: ApplicantPermissionRow[];
  applicantsToReject: Record<string, unknown>[];
};
