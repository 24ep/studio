import type { PlatformModuleId } from '@/lib/types';

export interface BulkApplicantPermissionDenial {
  applicantId: string;
  reason?: string;
}

interface BulkApplicantPermissionDecision {
  allowed: boolean;
  reason?: string;
}

type PermissionUser = {
  modulePermissions?: PlatformModuleId[];
  role?: string;
};

type HasAnyPermission = (user: PermissionUser | null | undefined, required: PlatformModuleId[]) => boolean;

export function getBulkApplicantActionPermissions(actionType: unknown): PlatformModuleId[] | null {
  switch (actionType) {
    case 'assign_recruiter':
      return ['applicantS_RECRUITER_ASSIGN', 'applicantS_RECRUITER_ASSIGN_OWN'];
    case 'change_status':
      return ['applicantS_PIPELINE_STAGE_BULK_UPDATE', 'applicantS_PIPELINE_STAGE_UPDATE_OWN'];
    case 'delete':
      return ['applicantS_DELETE'];
    case 'reprocess':
      return ['applicantS_EDIT_BASIC', 'applicantS_EDIT_BASIC_OWN'];
    default:
      return null;
  }
}

export function canPerformBulkApplicantAction(
  user: PermissionUser | null | undefined,
  actionType: unknown,
  hasAnyPermissionFn: HasAnyPermission
): boolean {
  const requiredPermissions = getBulkApplicantActionPermissions(actionType);
  return requiredPermissions ? hasAnyPermissionFn(user, requiredPermissions) : false;
}

export function getBulkApplicantActionForbiddenMessage(actionType: unknown): string {
  switch (actionType) {
    case 'change_status':
      return 'Forbidden: You do not have permission to update Applicant status. Please contact your administrator to request the "applicantS_PIPELINE_STAGE_BULK_UPDATE" permission.';
    case 'assign_recruiter':
      return 'Forbidden: You do not have permission to assign recruiters to Applicants. Please contact your administrator to request the "applicantS_RECRUITER_ASSIGN" permission.';
    case 'delete':
      return 'Forbidden: You do not have permission to delete Applicants. Please contact your administrator to request the "applicantS_DELETE" permission.';
    case 'reprocess':
      return 'Forbidden: You do not have permission to re-process Applicants. Please contact your administrator to request the "applicantS_EDIT_BASIC" permission.';
    default:
      return 'Forbidden: You do not have permission to perform this action on Applicants. Please contact your administrator.';
  }
}

export function partitionApplicantsByPermission<TApplicant extends { id: string } & Record<string, unknown>>(
  applicants: TApplicant[],
  getPermissionDecision: (applicant: TApplicant) => BulkApplicantPermissionDecision
) {
  const applicantsWithPermission: TApplicant[] = [];
  const applicantsWithoutPermission: BulkApplicantPermissionDenial[] = [];

  for (const applicant of applicants) {
    const permission = getPermissionDecision(applicant);
    if (permission.allowed) {
      applicantsWithPermission.push(applicant);
    } else {
      applicantsWithoutPermission.push({
        applicantId: applicant.id,
        reason: permission.reason,
      });
    }
  }

  return {
    applicantsWithPermission,
    applicantsWithoutPermission,
  };
}
