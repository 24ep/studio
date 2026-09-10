import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';

export async function getSearchApplicantsV1User(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  return token ? verifyApiToken(token) : null;
}
