export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

import { handleCors } from '@/lib/cors';
import { getPool } from '@/lib/db';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createInternalServerError,
  createNotFoundError,
  createValidationError,
} from '@/lib/errors';

import {
  getAvatarRouteErrorMessage,
  validateAvatarUploadFile,
} from '../../../../applicants/[id]/avatar/avatar-route-utils';
import {
  requireAvatarV1ReadUser,
  requireAvatarV1UploadUser,
} from './avatar-v1-route-auth';
import { canUploadAvatarForApplicant } from './avatar-v1-route-permissions';
import {
  fetchAvatarV1Applicant,
  fetchAvatarV1ApplicantUrl,
  updateAvatarV1ApplicantUrl,
} from './avatar-v1-route-data';
import { buildAvatarV1UploadResponse } from './avatar-v1-route-response';
import {
  ensureAvatarV1StorageReady,
  uploadAvatarV1File,
} from './avatar-v1-route-storage';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: applicantId } = await params;
  const auth = await requireAvatarV1UploadUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const fileValidation = validateAvatarUploadFile(formData.get('avatar'));
    if (!fileValidation.ok) {
      return SimpleErrorHandler.handleApiError(req, createValidationError(fileValidation.message));
    }

    const storageError = await ensureAvatarV1StorageReady(req);
    if (storageError) {
      return storageError;
    }

    const avatarUrl = await uploadAvatarV1File({
      applicantId,
      file: fileValidation.file,
      userId: auth.user.id,
    });

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const applicant = await fetchAvatarV1Applicant(client, applicantId);
      if (!applicant) {
        await client.query('ROLLBACK');
        return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
      }

      if (!canUploadAvatarForApplicant({
        applicantRecruiterId: applicant.recruiterId,
        hasGlobalEditPermission: auth.hasGlobalEditPermission,
        hasOwnEditPermission: auth.hasOwnEditPermission,
        user: auth.user,
      })) {
        await client.query('ROLLBACK');
        return SimpleErrorHandler.handleApiError(
          req,
          createForbiddenError('You can only upload avatars for applicants assigned to you')
        );
      }

      if (!await updateAvatarV1ApplicantUrl(client, applicantId, avatarUrl)) {
        await client.query('ROLLBACK');
        return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to update Applicant'));
      }

      await client.query('COMMIT');

      return SimpleErrorHandler.createSuccessResponse(req, buildAvatarV1UploadResponse({
        applicantId,
        applicantName: applicant.name,
        avatarUrl,
      }), 200);
    } catch (dbError) {
      await client.query('ROLLBACK');
      const errorMessage = getAvatarRouteErrorMessage(dbError, String(dbError));
      return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Database error: ${errorMessage}`));
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = getAvatarRouteErrorMessage(error, String(error));
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Internal server error: ${errorMessage}`));
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: applicantId } = await params;
  const auth = await requireAvatarV1ReadUser(req);
  if (!auth.ok) {
    return auth.response;
  }

  const client = await getPool().connect();
  try {
    const avatarUrl = await fetchAvatarV1ApplicantUrl(client, applicantId);
    if (avatarUrl === undefined) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
    }

    return SimpleErrorHandler.createSuccessResponse(req, {
      avatar_url: avatarUrl || null,
    }, 200);
  } catch (error) {
    const errorMessage = getAvatarRouteErrorMessage(error, String(error));
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Database error: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}
