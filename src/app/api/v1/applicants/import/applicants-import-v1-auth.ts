import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { jsonV1ApplicantImportResponse } from './applicants-import-v1-response';

export type V1ApplicantImportUser = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export async function requireV1ApplicantImportUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) as V1ApplicantImportUser | null : null;

  return user
    ? { ok: true as const, user }
    : { ok: false as const, response: jsonV1ApplicantImportResponse(request, { error: 'Unauthorized' }, 401) };
}

export function requireV1ApplicantImportPermission(request: NextRequest, user: V1ApplicantImportUser) {
  if (user.role !== 'Admin' && !user.modulePermissions?.includes('applicantS_IMPORT')) {
    return {
      ok: false as const,
      response: jsonV1ApplicantImportResponse(
        request,
        { error: 'Forbidden: Insufficient permissions to import Applicants' },
        403
      ),
    };
  }

  return { ok: true as const };
}
