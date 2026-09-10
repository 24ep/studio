import { createDateInTimezone } from '../../../../lib/dateUtils';
import type {
  AutomationApplicantInput,
  AutomationJobMatchInput,
  AutomationJobMatchWithJobId,
} from './create-applicant-with-matches-schema';

export type AutomationQueryValue = string | number | Date | string[] | null | undefined;

export function hasJobId(match: AutomationJobMatchInput): match is AutomationJobMatchWithJobId {
  return typeof match.jobId === 'string' && match.jobId.length > 0;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getSafeAutomationJobMatches(
  jobMatches: AutomationJobMatchInput[] | undefined,
  isJobMatchEnabled: boolean
) {
  return isJobMatchEnabled ? (jobMatches ?? []).filter(hasJobId) : [];
}

export function buildAutomationApplicantData(
  applicantData: AutomationApplicantInput,
  safeJobMatches: AutomationJobMatchWithJobId[]
): AutomationApplicantInput {
  const parsedData = applicantData.parsedData ? { ...applicantData.parsedData } : undefined;

  if (safeJobMatches.length > 0) {
    return {
      ...applicantData,
      parsedData: {
        ...parsedData,
        job_matches: safeJobMatches,
      },
      positionId: applicantData.positionId || safeJobMatches[0].jobId,
    };
  }

  if (parsedData && 'job_matches' in parsedData) {
    delete parsedData.job_matches;
  }

  return {
    ...applicantData,
    parsedData,
  };
}

export function getAutomationJobMatchAuditCount(
  isJobMatchEnabled: boolean,
  safeJobMatches: AutomationJobMatchWithJobId[]
) {
  return isJobMatchEnabled ? safeJobMatches.length : 0;
}

export function buildApplicantInsertParams({
  applicantData,
  applicantId,
  resolvedStatusId,
  now = createDateInTimezone(),
}: {
  applicantData: AutomationApplicantInput;
  applicantId: string;
  resolvedStatusId: string;
  now?: Date;
}): AutomationQueryValue[] {
  const applicationDateToUse = applicantData.applicationDate || applicantData.uploadDate;

  return [
    applicantId,
    applicantData.name,
    applicantData.email,
    applicantData.phone,
    resolvedStatusId,
    applicantData.avatarUrl,
    applicantData.positionId,
    applicantData.recruiterId,
    applicantData.parsedData ? JSON.stringify(applicantData.parsedData) : null,
    applicantData.fitScore,
    applicantData.dataAiHint,
    applicationDateToUse ? new Date(applicationDateToUse) : now,
    applicantData.emailDate ? new Date(applicantData.emailDate) : null,
    applicantData.emailSubject || null,
    applicantData.emailId || null,
    applicantData.emailMetadata ? JSON.stringify(applicantData.emailMetadata) : null,
  ];
}

export function buildJobMatchInsertParams({
  applicantId,
  match,
  matchId,
}: {
  applicantId: string;
  match: AutomationJobMatchWithJobId;
  matchId: string;
}): AutomationQueryValue[] {
  return [
    matchId,
    applicantId,
    match.jobId,
    match.jobTitle,
    match.fitScore,
    match.matchReasons,
    match.job_description_summary,
  ];
}
