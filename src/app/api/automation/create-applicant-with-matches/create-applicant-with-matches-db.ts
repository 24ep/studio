import type { QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { DbClient } from '@/lib/db';
import type {
  AutomationApplicantInput,
  AutomationJobMatchWithJobId,
} from './create-applicant-with-matches-schema';
import {
  buildApplicantInsertParams,
  buildJobMatchInsertParams,
} from './create-applicant-with-matches-utils';

export type ExistingApplicantRow = QueryResultRow & {
  id: string;
  name: string;
  email: string;
};

type RecruitmentStageIdRow = QueryResultRow & {
  id: string;
};

export async function findExistingAutomationApplicant(
  client: DbClient,
  email: string,
) {
  const result = await client.query<ExistingApplicantRow>(
    `SELECT id, name, email FROM "Applicant" WHERE email = $1`,
    [email]
  );

  return result.rows[0] ?? null;
}

export async function resolveAutomationApplicantStatusId(
  client: DbClient,
  applicantData: AutomationApplicantInput,
) {
  if (applicantData.status) {
    return applicantData.status;
  }

  const appliedStageRes = await client.query<RecruitmentStageIdRow>(
    'SELECT id FROM "RecruitmentStage" WHERE LOWER(name) = $1 LIMIT 1',
    ['applied']
  );

  return appliedStageRes.rows[0]?.id || null;
}

export async function insertAutomationApplicant({
  applicantData,
  applicantId,
  client,
  resolvedStatusId,
}: {
  applicantData: AutomationApplicantInput;
  applicantId: string;
  client: DbClient;
  resolvedStatusId: string;
}) {
  const insertApplicantQuery = `
    INSERT INTO "Applicant" (id, name, email, phone, "statusId", "avatarUrl", "positionId", "recruiterId", "parsedData", "fitScore", "dataAiHint", "applicationDate", "emailDate", "emailSubject", "emailId", "emailMetadata", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
    RETURNING *;
  `;
  const applicantParams = buildApplicantInsertParams({
    applicantData,
    applicantId,
    resolvedStatusId,
  });

  const newApplicantResult = await client.query<QueryResultRow>(insertApplicantQuery, applicantParams);
  return newApplicantResult.rows[0];
}

export async function insertAutomationJobMatches({
  applicantId,
  client,
  safeJobMatches,
}: {
  applicantId: string;
  client: DbClient;
  safeJobMatches: AutomationJobMatchWithJobId[];
}) {
  if (safeJobMatches.length === 0) {
    return;
  }

  const insertMatchQuery = `
    INSERT INTO "JobMatch" (id, "applicant_id", "jobId", "jobTitle", "fitScore", "matchReasons", "job_description_summary", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
  `;

  for (const match of safeJobMatches) {
    const matchParams = buildJobMatchInsertParams({
      applicantId,
      match,
      matchId: uuidv4(),
    });
    await client.query(insertMatchQuery, matchParams);
  }
}
