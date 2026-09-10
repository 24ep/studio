interface QueryResult<T> {
  rows: T[];
}

interface AvatarV1RouteClient {
  query<T>(queryText: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}

export interface AvatarV1ApplicantRow {
  id: string;
  name: string;
  recruiterId: string | null;
}

export async function fetchAvatarV1Applicant(
  client: AvatarV1RouteClient,
  applicantId: string
) {
  const result = await client.query<AvatarV1ApplicantRow>(
    'SELECT id, name, "recruiterId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );
  return result.rows[0] ?? null;
}

export async function updateAvatarV1ApplicantUrl(
  client: AvatarV1RouteClient,
  applicantId: string,
  avatarUrl: string
) {
  const result = await client.query(
    'UPDATE "Applicant" SET "avatarUrl" = $1 WHERE id = $2 RETURNING *;',
    [avatarUrl, applicantId]
  );
  return result.rows.length > 0;
}

export async function fetchAvatarV1ApplicantUrl(
  client: AvatarV1RouteClient,
  applicantId: string
) {
  const result = await client.query<{ avatarUrl: string | null }>(
    'SELECT "avatarUrl" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );
  return result.rows[0]?.avatarUrl;
}
