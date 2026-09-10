import type {
  ApplicantDetailAuthInput,
  ApplicantHeadStatusInput,
  ApplicantJobMatchFeatureInput,
} from './applicant-detail-route-types';

export async function getApplicantJobMatchFeatureEnabled({
  readSystemSetting,
  onError,
}: ApplicantJobMatchFeatureInput) {
  try {
    const jobMatchFeatureEnabled = await readSystemSetting('jobMatchFeatureEnabled');
    return jobMatchFeatureEnabled !== 'false';
  } catch (error) {
    onError?.(error);
    return true;
  }
}

export async function fetchApplicantHeadStatus({
  client,
  applicantId,
  now = Date.now,
}: ApplicantHeadStatusInput) {
  await client.query('SET statement_timeout = 5000');

  const startTime = now();
  const result = await client.query(
    'SELECT 1 FROM "Applicant" WHERE id = $1::uuid LIMIT 1',
    [applicantId]
  );

  return {
    exists: result.rows.length > 0,
    queryTimeMs: now() - startTime,
  };
}

export async function isAuthorizedForApplicantDetail({
  applicantId,
  userId,
  token,
  connectClient,
}: ApplicantDetailAuthInput) {
  if (userId) return true;
  if (!token) return false;

  let authClient: Awaited<ReturnType<typeof connectClient>> | undefined;
  try {
    authClient = await connectClient();
    const result = await authClient.query(
      'SELECT id FROM "ApplicantEvaluationLink" WHERE token = $1 AND "applicantId" = $2::uuid AND "expiresAt" > NOW() AND "revokedAt" IS NULL',
      [token, applicantId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Token validation failed', error);
    return false;
  } finally {
    authClient?.release();
  }
}
