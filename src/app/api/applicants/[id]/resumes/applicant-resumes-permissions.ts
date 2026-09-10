import { NextResponse } from 'next/server';
import { canEditApplicant } from '@/lib/permissions';
import { permissionMatches } from '@/lib/permission-aliases';
import type { SessionLikeUser } from '@/lib/permissions';

type AttachmentDeleteSessionUser = SessionLikeUser & {
  id: string;
};

export function getAttachmentDeletePermissionError(sessionUser: AttachmentDeleteSessionUser, recruiterId: string | null) {
  const hasGlobalEditPermission =
    permissionMatches(sessionUser.modulePermissions, 'APPLICANTS_EDIT_BASIC') ||
    permissionMatches(sessionUser.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE');
  const hasOwnEditPermission =
    permissionMatches(sessionUser.modulePermissions, 'APPLICANTS_EDIT_BASIC_OWN') ||
    permissionMatches(sessionUser.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE_OWN');

  if (sessionUser.role !== 'Admin' && !hasGlobalEditPermission && !hasOwnEditPermission) {
    return NextResponse.json({ message: 'Insufficient permissions to delete attachments' }, { status: 403 });
  }

  if (sessionUser.role !== 'Admin' && !hasGlobalEditPermission) {
    const editPermission = canEditApplicant(sessionUser, recruiterId, sessionUser.id);
    if (!editPermission.canEdit) {
      return NextResponse.json({ message: `Forbidden: ${editPermission.reason}` }, { status: 403 });
    }
  }

  return null;
}
