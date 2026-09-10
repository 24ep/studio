import { type NextRequest } from 'next/server';
import { clearDuplicatesResponse } from './clear-duplicates-response';
import type { DuplicateAnalysisResult } from './clear-duplicates-types';

type ResultContext = {
  request: NextRequest;
  dryRun: boolean;
  positionId?: string | null;
};

export function noApplicantsResponse({ request, dryRun }: ResultContext) {
  return clearDuplicatesResponse(request, {
    success: true,
    data: {
      message: 'No Applicants found',
      duplicatesFound: 0,
      applicantsToDelete: 0,
      dryRun,
    },
  });
}

export function noDuplicatesResponse({ request, dryRun }: ResultContext) {
  return clearDuplicatesResponse(request, {
    success: true,
    data: {
      message: 'No duplicate Applicants found',
      duplicatesFound: 0,
      applicantsToDelete: 0,
      dryRun,
    },
  });
}

export function dryRunResponse(context: ResultContext, analysis: DuplicateAnalysisResult) {
  return clearDuplicatesResponse(context.request, {
    success: true,
    data: {
      message: 'Dry run completed - no changes made',
      duplicatesFound: analysis.duplicateGroups.length,
      applicantsToDelete: analysis.totalToDelete,
      keptApplicants: analysis.keptApplicants,
      applicantsToDeleteDetails: analysis.applicantsToDelete,
      dryRun: context.dryRun,
    },
  });
}

export function deleteSuccessResponse(context: ResultContext, analysis: DuplicateAnalysisResult) {
  return clearDuplicatesResponse(context.request, {
    success: true,
    data: {
      message: `Successfully cleared ${analysis.totalToDelete} duplicate Applicants`,
      duplicatesFound: analysis.duplicateGroups.length,
      applicantsDeleted: analysis.totalToDelete,
      keptApplicants: analysis.keptApplicants,
      dryRun: context.dryRun,
    },
  });
}
