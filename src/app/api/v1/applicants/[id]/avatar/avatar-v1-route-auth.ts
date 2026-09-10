import type { NextRequest } from 'next/server';

import { verifyApiToken } from '@/lib/auth';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createUnauthorizedError,
} from '@/lib/errors';
import { permissionMatches } from '@/lib/permission-aliases';

import {
  canUploadAvatarWithAnyApplicantScope,
  type AvatarV1EditPermissions,
} from './avatar-v1-route-permissions';

export type AvatarV1User = NonNullable<Awaited<ReturnType<typeof verifyApiToken>>>;

export async function requireAvatarV1ReadUser(req: NextRequest) {
  const user = await getAvatarV1RequestUser(req);
  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required')),
    };
  }

  return { ok: true as const, user };
}

export async function requireAvatarV1UploadUser(req: NextRequest) {
  const auth = await requireAvatarV1ReadUser(req);
  if (!auth.ok) {
    return auth;
  }

  const permissions = getAvatarV1EditPermissions(auth.user);
  if (!canUploadAvatarWithAnyApplicantScope(auth.user, permissions)) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        req,
        createForbiddenError('Insufficient permissions to upload avatars')
      ),
    };
  }

  return { ok: true as const, user: auth.user, ...permissions };
}

async function getAvatarV1RequestUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  return token ? await verifyApiToken(token) : null;
}

function getAvatarV1EditPermissions(user: AvatarV1User): AvatarV1EditPermissions {
  return {
    hasGlobalEditPermission: permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_BASIC'),
    hasOwnEditPermission: permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_BASIC_OWN'),
  };
}
