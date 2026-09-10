import type { BulkActionEarlyExit } from './bulk-action-route-types';
import type { BulkApplicantPermissionDenial } from './bulk-action-route-utils';

export function buildStatusPermissionDeniedExit({
  deniedApplicants,
  actingUserName,
}: {
  deniedApplicants: BulkApplicantPermissionDenial[];
  actingUserName: string;
}): BulkActionEarlyExit {
  const deniedApplicantIds = deniedApplicants.map((applicant) => applicant.applicantId).join(', ');

  return {
    status: 403,
    body: {
      message: `Forbidden: You don't have permission to update status for some Applicants. Denied Applicants: ${deniedApplicantIds}`,
      deniedApplicants,
    },
    audit: {
      level: 'WARN',
      message: `Bulk status update denied for Applicants: ${deniedApplicantIds} by ${actingUserName}`,
    },
  };
}

export function buildStatusUpdateAuditMessage({
  newStatus,
  updatedCount,
  rejectedCount,
  autoCloseResults,
}: {
  newStatus: string | undefined;
  updatedCount: number;
  rejectedCount: number;
  autoCloseResults: Record<string, unknown>[];
}) {
  const successMessage = `Updated status to ${newStatus} for ${updatedCount} Applicants`;
  const rejectMessage = rejectedCount > 0
    ? `, rejected ${rejectedCount} Applicants due to headcount constraints`
    : '';
  const closedPositionCount = autoCloseResults.filter(
    (item) => (item.autoCloseResult as { action?: string } | undefined)?.action === 'closed'
  ).length;
  const autoCloseMessage = autoCloseResults.length > 0
    ? `, auto-closed ${closedPositionCount} positions`
    : '';

  return successMessage + rejectMessage + autoCloseMessage;
}
