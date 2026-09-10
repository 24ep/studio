import {
  APPLICANT_AFTER_UPDATE_QUERY,
  APPLICANT_DETAIL_ATTACHMENTS_QUERY,
  APPLICANT_DETAIL_JOB_MATCHES_QUERY,
  APPLICANT_DETAIL_QUERY,
  COMPANY_REFERENCES_BY_IDS_QUERY,
  APPLICANT_UPDATE_ATTACHMENTS_QUERY,
  APPLICANT_UPDATE_JOB_MATCHES_QUERY,
} from './applicant-detail-queries';
import { getApplicantReadStatus } from './applicant-detail-read-status';
import type { CompanyReference } from '@/lib/types';
import {
  buildApplicantDetailResponseData,
  normalizeApplicantCustomAttributes,
  collectCompanyReferenceIdsFromApplicantExperience,
  type ApplicantDetailApplicantRow,
  type ApplicantDetailAttachmentRow,
  type ApplicantDetailJobMatchRow,
  normalizeCompanyReferences,
} from './applicant-detail-response-utils';
import type {
  ApplicantDetailFetchInput,
  ApplicantDetailFetchResult,
  ApplicantDetailQueryClient,
  ApplicantPostUpdateResponseParts,
  ApplicantPostUpdateResponsePartsInput,
} from './applicant-detail-route-types';

async function runTimedApplicantDetailQuery(
  client: ApplicantDetailQueryClient,
  query: string,
  values: unknown[],
  {
    label,
    applicantId,
    warnAfterMs,
  }: {
    label: string;
    applicantId: string;
    warnAfterMs: number;
  }
) {
  const startTime = Date.now();
  const result = await client.query(query, values);
  const queryTime = Date.now() - startTime;

  if (queryTime > warnAfterMs) {
    console.warn(`[PERF] Slow ${label} query: ${queryTime}ms for ID: ${applicantId}`);
  }

  return result;
}

async function fetchApplicantCompanyReferences(
  client: ApplicantDetailQueryClient,
  applicant: ApplicantDetailApplicantRow,
  applicantId: string,
): Promise<CompanyReference[]> {
  const companyReferenceIds = collectCompanyReferenceIdsFromApplicantExperience({
    parsedData: applicant.parsedData,
    experienceData: applicant.experienceData,
  });
  if (companyReferenceIds.length === 0) {
    return [];
  }

  const companyReferencesResult = await runTimedApplicantDetailQuery(
    client,
    COMPANY_REFERENCES_BY_IDS_QUERY,
    [companyReferenceIds],
    { label: 'experience company references', applicantId, warnAfterMs: 2500 }
  );
  return normalizeCompanyReferences(companyReferencesResult.rows as unknown[]);
}

export async function fetchApplicantDetailResponseData({
  client,
  applicantId,
  userId,
  lite,
  readSystemSetting,
}: ApplicantDetailFetchInput): Promise<ApplicantDetailFetchResult> {
  const applicantResult = await runTimedApplicantDetailQuery(
    client,
    APPLICANT_DETAIL_QUERY,
    [applicantId],
    { label: 'Applicant', applicantId, warnAfterMs: 5000 }
  );

  if (applicantResult.rows.length === 0) {
    return { found: false };
  }

  const applicant = applicantResult.rows[0] as ApplicantDetailApplicantRow;
  const jobMatchFeatureEnabled = lite ? 'false' : await readSystemSetting('jobMatchFeatureEnabled');
  const isJobMatchEnabled = !lite && jobMatchFeatureEnabled !== 'false';

  let jobMatches: ApplicantDetailJobMatchRow[] = [];
  if (isJobMatchEnabled) {
    const jobMatchesResult = await runTimedApplicantDetailQuery(
      client,
      APPLICANT_DETAIL_JOB_MATCHES_QUERY,
      [applicantId],
      { label: 'job matches', applicantId, warnAfterMs: 3000 }
    );
    jobMatches = jobMatchesResult.rows as ApplicantDetailJobMatchRow[];
  }

  let attachments: ApplicantDetailAttachmentRow[] = [];
  if (!lite) {
    const attachmentsResult = await runTimedApplicantDetailQuery(
      client,
      APPLICANT_DETAIL_ATTACHMENTS_QUERY,
      [applicantId],
      { label: 'attachments', applicantId, warnAfterMs: 3000 }
    );
    attachments = attachmentsResult.rows as ApplicantDetailAttachmentRow[];
  }

  const userReadStatus = userId
    ? await getApplicantReadStatus(client, applicantId, userId)
    : null;
  const companyReferences = await fetchApplicantCompanyReferences(client, applicant, applicantId);

  return {
    found: true,
    responseData: buildApplicantDetailResponseData({
      applicant,
      jobMatches,
      attachments,
      userReadStatus,
      lite,
      companyReferences,
    }),
  };
}

export async function fetchApplicantPostUpdateResponseParts({
  client,
  applicantId,
  actingUserId,
  isJobMatchEnabled,
  newReadStatus,
}: ApplicantPostUpdateResponsePartsInput): Promise<ApplicantPostUpdateResponseParts> {
  const applicantResult = await client.query(APPLICANT_AFTER_UPDATE_QUERY, [applicantId]);

  if (applicantResult.rows.length === 0) {
    throw new Error('Applicant not found after update');
  }

  const applicant = applicantResult.rows[0] as ApplicantDetailApplicantRow;
  const companyReferences = await fetchApplicantCompanyReferences(client, applicant, applicantId);
  const jobMatchesResult = isJobMatchEnabled
    ? await client.query(APPLICANT_UPDATE_JOB_MATCHES_QUERY, [applicantId])
    : { rows: [] };
  const attachmentsResult = await client.query(APPLICANT_UPDATE_ATTACHMENTS_QUERY, [applicantId]);
  const customAttributes = normalizeApplicantCustomAttributes(applicant.customAttributes);
  const userReadStatus = newReadStatus !== undefined
    ? newReadStatus
    : await getApplicantReadStatus(client, applicantId, actingUserId);

  return {
    applicant,
    customAttributes,
    jobMatches: jobMatchesResult.rows as ApplicantDetailJobMatchRow[],
    attachments: attachmentsResult.rows as ApplicantDetailAttachmentRow[],
    userReadStatus,
    companyReferences,
  };
}
