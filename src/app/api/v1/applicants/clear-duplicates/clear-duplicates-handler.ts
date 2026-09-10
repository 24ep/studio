import { type NextRequest } from 'next/server';
import { analyzeDuplicateApplicants } from './clear-duplicates-analysis';
import {
  getAuditUserIdFromRequest,
  requireClearDuplicatesUser,
} from './clear-duplicates-auth';
import { safeLogClearDuplicatesAudit } from './clear-duplicates-audit';
import {
  fetchApplicantsForDuplicateScan,
  verifyClearDuplicatesDatabaseConnection,
} from './clear-duplicates-data';
import { executeDuplicateApplicantDeletion } from './clear-duplicates-delete';
import { parseClearDuplicatesRequest } from './clear-duplicates-request';
import { clearDuplicatesErrorResponse } from './clear-duplicates-response';
import {
  deleteSuccessResponse,
  dryRunResponse,
  noApplicantsResponse,
  noDuplicatesResponse,
} from './clear-duplicates-results';

export async function handleClearDuplicateApplicants(request: NextRequest) {
  try {
    const authorization = await requireClearDuplicatesUser(request);
    if (!authorization.ok) {
      return authorization.response;
    }

    const parsedRequest = await parseClearDuplicatesRequest(request);
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }

    const { dryRun, positionId } = parsedRequest;
    const context = { request, dryRun, positionId };

    try {
      await verifyClearDuplicatesDatabaseConnection();
    } catch (dbTestError) {
      console.error('[Clear Duplicates] Database connection test failed:', dbTestError);
      return clearDuplicatesErrorResponse(request, 'Database connection failed', 500);
    }

    const applicants = await fetchApplicantsForDuplicateScan(positionId);
    if (applicants.length === 0) {
      await safeLogClearDuplicatesAudit('AUDIT', 'Clear duplicates completed - no applicants found', authorization.user.id, {
        dryRun,
        positionId,
        applicantsFound: 0,
      });
      return noApplicantsResponse(context);
    }

    const analysis = analyzeDuplicateApplicants(applicants);
    if (analysis.duplicateGroups.length === 0) {
      await safeLogClearDuplicatesAudit('AUDIT', 'Clear duplicates dry run completed - no duplicates found', authorization.user.id, {
        dryRun,
        positionId,
        duplicatesFound: 0,
      });
      return noDuplicatesResponse(context);
    }

    if (dryRun) {
      await safeLogClearDuplicatesAudit('AUDIT', 'Clear duplicates dry run completed', authorization.user.id, {
        dryRun,
        positionId,
        duplicatesFound: analysis.duplicateGroups.length,
        applicantsToDelete: analysis.totalToDelete,
      });
      return dryRunResponse(context, analysis);
    }

    const deleteResult = await executeDuplicateApplicantDeletion(analysis.applicantsToDelete, authorization.user.id, {
      dryRun,
      positionId,
    });
    if (!deleteResult.ok) {
      return clearDuplicatesErrorResponse(request, 'Failed to delete duplicate Applicants', 500);
    }

    await safeLogClearDuplicatesAudit(
      'AUDIT',
      `Successfully cleared ${analysis.totalToDelete} duplicate Applicants`,
      authorization.user.id,
      {
        dryRun,
        positionId,
        duplicatesFound: analysis.duplicateGroups.length,
        applicantsDeleted: analysis.totalToDelete,
      }
    );
    return deleteSuccessResponse(context, analysis);
  } catch (error) {
    console.error('[Clear Duplicates] Unexpected error:', error);
    const userId = await getAuditUserIdFromRequest(request);
    await safeLogClearDuplicatesAudit('ERROR', 'Failed to clear duplicate Applicants', userId, {
      error: (error as Error).message,
    });
    return clearDuplicatesErrorResponse(request, 'Failed to clear duplicate Applicants', 500);
  }
}
