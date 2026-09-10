import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { errorResponse } from './bulk-upload-cv-response';
import type { BulkUploadCvUser } from './bulk-upload-cv-types';

export async function requireBulkUploadCvUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) as BulkUploadCvUser | null : null;

  if (!user) {
    return {
      ok: false as const,
      response: errorResponse(request, 'Unauthorized', 401),
    };
  }

  const canBulkUpload = user.role === 'Admin' || user.modulePermissions?.includes('BULK_UPLOAD_EXECUTE');
  if (!canBulkUpload) {
    return {
      ok: false as const,
      response: errorResponse(request, 'Forbidden: Insufficient permissions', 403),
    };
  }

  return { ok: true as const, user };
}
