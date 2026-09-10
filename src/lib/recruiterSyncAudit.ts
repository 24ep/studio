import { logAudit } from '@/lib/auditLog';

import type { RecruiterSyncResult } from './recruiterSyncTypes';

export function logApplicantRecruiterAssignmentFireAndForget({
  actingUserId,
  applicantId,
  applicantName,
  positionId,
  recruiterId,
  recruiterLabel,
  source,
}: {
  actingUserId: string;
  applicantId: string;
  applicantName?: string;
  positionId: string;
  recruiterId: string;
  recruiterLabel: string;
  source: 'RecruiterSync:Position' | 'RecruiterSync:Applicant';
}) {
  const subject = applicantName ? `Applicant ${applicantName}` : 'Applicant';

  logAudit(
    'INFO',
    `${subject} recruiter auto-assigned to ${recruiterLabel}`,
    source,
    actingUserId,
    {
      applicantId,
      positionId,
      oldRecruiterId: null,
      newRecruiterId: recruiterId,
    }
  ).catch((error) => {
    console.error('Failed to log audit for applicant sync:', error);
  });
}

export function logPositionRecruiterSyncCompletion({
  actingUserId,
  positionId,
  positionTitle,
  result,
}: {
  actingUserId: string;
  positionId: string;
  positionTitle: string;
  result: RecruiterSyncResult;
}) {
  logAudit(
    'INFO',
    `Recruiter sync completed for position "${positionTitle}": ${result.applicantsUpdated} updated, ${result.applicantsSkipped} skipped`,
    'RecruiterSync:Position',
    actingUserId,
    { positionId, result }
  ).catch((error) => {
    console.error('Failed to log audit for sync completion:', error);
  });
}

export function logApplicantRecruiterAssignment({
  actingUserId,
  applicantId,
  positionId,
  recruiterId,
  recruiterLabel,
}: {
  actingUserId: string;
  applicantId: string;
  positionId: string;
  recruiterId: string;
  recruiterLabel: string;
}) {
  return logAudit(
    'INFO',
    `Applicant recruiter auto-assigned to ${recruiterLabel}`,
    'RecruiterSync:Applicant',
    actingUserId,
    {
      applicantId,
      positionId,
      oldRecruiterId: null,
      newRecruiterId: recruiterId,
    }
  );
}
