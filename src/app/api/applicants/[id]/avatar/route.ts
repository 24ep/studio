import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { ensureBucketExists, minioClient, MINIO_BUCKET } from '@/lib/minio';
import { canEditApplicant, hasPermission } from '@/lib/permissions';
import { validateUuid } from '@/lib/security';
import { NextResponse, type NextRequest } from 'next/server';

import {
  fetchApplicantAvatarUrl,
  fetchAvatarApplicantRecruiterId,
  updateApplicantAvatarUrl,
} from './avatar-route-queries';
import {
  buildAvatarObjectName,
  buildAvatarPreviewUrl,
  buildPublicReadBucketPolicy,
  extractApplicantIdFromAvatarRequest,
  getAvatarRouteErrorMessage,
  validateAvatarUploadFile,
} from './avatar-route-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AVATAR_UPLOAD_AUDIT_CONTEXT = 'API:Applicants:Avatar:Upload';

function buildActingUserName(sessionUser: { id?: string | null; name?: string | null; email?: string | null } | undefined): string {
  return sessionUser?.name || sessionUser?.email || sessionUser?.id || 'System';
}

async function ensureAvatarStorageReady(actingUserId: string, applicantId: string) {
  try {
    await ensureBucketExists();
    if (process.env.ALLOW_PUBLIC_FILES === 'true') {
      await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(buildPublicReadBucketPolicy(MINIO_BUCKET)));
    }
    return null;
  } catch (error) {
    await logAudit('ERROR', `Avatar upload failed - MinIO bucket error: ${error}`, AVATAR_UPLOAD_AUDIT_CONTEXT, actingUserId, {
      applicantId,
    });
    return NextResponse.json({ message: 'Storage service unavailable' }, { status: 503 });
  }
}

function parseApplicantIdForAvatar(request: NextRequest, action: 'GET' | 'POST') {
  const applicantId = extractApplicantIdFromAvatarRequest(request);

  if (!applicantId) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Missing applicantId' }, { status: 400 }),
    } as const;
  }

  if (!validateUuid(applicantId)) {
    console.error(`[SECURITY] Invalid UUID format in applicants avatar ${action} request:`, applicantId);
    return {
      ok: false,
      response: NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 }),
    } as const;
  }

  return { ok: true, applicantId } as const;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = buildActingUserName(session?.user);

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const hasGlobalEditPermission = hasPermission(session.user, 'APPLICANTS_EDIT_BASIC');
  const hasOwnEditPermission = hasPermission(session.user, 'APPLICANTS_EDIT_BASIC_OWN');
  if (!hasGlobalEditPermission && !hasOwnEditPermission) {
    await logAudit('WARN', `Forbidden attempt to upload avatar by ${actingUserName}.`, 'API:Applicants:Upload', actingUserId);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to upload avatars' }, { status: 403 });
  }

  const parsedApplicantId = parseApplicantIdForAvatar(request, 'POST');
  if (!parsedApplicantId.ok) {
    return parsedApplicantId.response;
  }
  const { applicantId } = parsedApplicantId;

  try {
    const formData = await request.formData();
    const fileValidation = validateAvatarUploadFile(formData.get('avatar'));
    if (!fileValidation.ok) {
      return NextResponse.json({ message: fileValidation.message }, { status: 400 });
    }

    const storageError = await ensureAvatarStorageReady(actingUserId, applicantId);
    if (storageError) {
      return storageError;
    }

    const file = fileValidation.file;
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectName = buildAvatarObjectName(applicantId, file.name);
    const webAppUrl = buildAvatarPreviewUrl(objectName);

    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': file.type,
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const recruiterId = await fetchAvatarApplicantRecruiterId(client, applicantId);
      if (recruiterId === undefined) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
      }

      if (!hasGlobalEditPermission) {
        const editPermission = canEditApplicant(session.user, recruiterId, actingUserId);
        if (!editPermission.canEdit) {
          await client.query('ROLLBACK');
          await logAudit(
            'WARN',
            `Forbidden attempt to upload avatar by ${actingUserName}: ${editPermission.reason}`,
            AVATAR_UPLOAD_AUDIT_CONTEXT,
            actingUserId,
          );
          return NextResponse.json({ message: `Forbidden: ${editPermission.reason}` }, { status: 403 });
        }
      }

      await updateApplicantAvatarUrl(client, applicantId, webAppUrl);
      await client.query('COMMIT');

      await logAudit(
        'AUDIT',
        `Avatar uploaded for Applicant ${applicantId} by ${actingUserName}.`,
        AVATAR_UPLOAD_AUDIT_CONTEXT,
        actingUserId,
        { applicantId, avatarUrl: webAppUrl },
      );
      return NextResponse.json({ message: 'Avatar uploaded successfully', avatarUrl: webAppUrl }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = getAvatarRouteErrorMessage(error, 'Unknown database error');
      await logAudit('ERROR', `Failed to update Applicant avatar. Error: ${errorMessage}`, AVATAR_UPLOAD_AUDIT_CONTEXT, actingUserId, {
        applicantId,
      });
      return NextResponse.json({ message: 'Failed to update Applicant avatar', error: errorMessage }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    const uploadErrorMessage = getAvatarRouteErrorMessage(error, 'Unknown upload error');
    await logAudit('ERROR', `Avatar upload failed. Error: ${uploadErrorMessage}`, AVATAR_UPLOAD_AUDIT_CONTEXT, actingUserId, {
      applicantId,
    });
    return NextResponse.json({ message: 'Avatar upload failed', error: uploadErrorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsedApplicantId = parseApplicantIdForAvatar(request, 'GET');
  if (!parsedApplicantId.ok) {
    return parsedApplicantId.response;
  }
  const { applicantId } = parsedApplicantId;

  const client = await getPool().connect();
  try {
    const avatarUrl = await fetchApplicantAvatarUrl(client, applicantId);
    if (avatarUrl === undefined) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json({
      avatar_url: avatarUrl || null,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Database error', error: String(error) }, { status: 500 });
  } finally {
    client.release();
  }
}
