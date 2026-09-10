import type { DbClient } from './applicant-recruiter-data';

async function fetchRecruiterNameForTransition(client: DbClient, recruiterId: string) {
  const result = await client.query('SELECT name FROM "User" WHERE id = $1', [recruiterId]);
  return result.rows[0]?.name as string | undefined;
}

export async function buildRecruiterChangeNotes(
  client: DbClient,
  recruiterId: string | null,
  oldRecruiterId: string | null
) {
  if (recruiterId && oldRecruiterId !== recruiterId) {
    const recruiterName = await fetchRecruiterNameForTransition(client, recruiterId);
    return `Recruiter assigned: ${recruiterName || 'Unknown'}`;
  }

  return !recruiterId && oldRecruiterId ? 'Recruiter unassigned' : '';
}
