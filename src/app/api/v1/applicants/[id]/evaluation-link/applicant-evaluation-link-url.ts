export function buildEvaluateUrl(applicantId: string, token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8021';
  return `${baseUrl}/applicants/${encodeURIComponent(applicantId)}/evaluate?token=${encodeURIComponent(token)}`;
}
