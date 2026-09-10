import { safeLogClearDuplicatesAudit } from './clear-duplicates-audit';
import { deleteDuplicateApplicants } from './clear-duplicates-data';
import type { DuplicateApplicant } from './clear-duplicates-types';

type DeleteContext = {
  dryRun: boolean;
  positionId?: string | null;
};

export async function executeDuplicateApplicantDeletion(
  applicantsToDelete: DuplicateApplicant[],
  userId: string,
  context: DeleteContext
) {
  const applicantIdsToDelete = applicantsToDelete.map(applicant => applicant.id);

  try {
    await deleteDuplicateApplicants(applicantIdsToDelete);
    return { ok: true as const };
  } catch (deleteError) {
    console.error('[Clear Duplicates] Error deleting Applicants:', deleteError);
    await safeLogClearDuplicatesAudit('ERROR', 'Failed to delete duplicate Applicants', userId, {
      dryRun: context.dryRun,
      positionId: context.positionId,
      applicantsToDelete: applicantIdsToDelete,
      error: (deleteError as Error).message,
    });
    return { ok: false as const };
  }
}
