interface QueryResult<T> {
  rows: T[];
}

interface AvatarRouteClient {
  query<T>(queryText: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}

export interface ApplicantRecruiterRow {
  recruiterId: string | null;
}

export async function fetchAvatarApplicantRecruiterId(
  client: AvatarRouteClient,
  applicantId: string,
): Promise<string | null | undefined> {
  const result = await client.query<ApplicantRecruiterRow>(
    'SELECT "recruiterId" FROM "Applicant" WHERE id = $1',
    [applicantId],
  );

  return result.rows[0]?.recruiterId;
}

export async function updateApplicantAvatarUrl(
  client: AvatarRouteClient,
  applicantId: string,
  avatarUrl: string,
): Promise<void> {
  await client.query(
    'UPDATE "Applicant" SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, "avatarUrl";',
    [avatarUrl, applicantId],
  );
}

export async function fetchApplicantAvatarUrl(
  client: AvatarRouteClient,
  applicantId: string,
): Promise<string | null | undefined> {
  const result = await client.query<{ avatarUrl: string | null }>(
    'SELECT "avatarUrl" FROM "Applicant" WHERE id = $1',
    [applicantId],
  );

  return result.rows[0]?.avatarUrl;
}
