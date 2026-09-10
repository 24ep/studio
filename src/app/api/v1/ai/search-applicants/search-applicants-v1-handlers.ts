import { type NextRequest } from 'next/server';
import { searchApplicantsAIChat } from '@/ai/flows/search-applicants-flow';
import { logAudit } from '@/lib/auditLog';
import { handleCors } from '@/lib/cors';
import {
  SimpleErrorHandler,
  createInternalServerError,
  createUnauthorizedError,
  createValidationError,
} from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';
import { getSearchApplicantsV1User } from './search-applicants-v1-auth';
import { fetchSearchApplicantDetails } from './search-applicants-v1-data';
import { searchApplicantsSchema } from './search-applicants-v1-schema';

export async function handleSearchApplicantsV1(request: NextRequest) {
  try {
    const user = await getSearchApplicantsV1User(request);
    if (!user) {
      return SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required'));
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return SimpleErrorHandler.handleApiError(request, createValidationError('Invalid JSON body'));
    }

    const validationResult = searchApplicantsSchema.safeParse(bodyResult.value);
    if (!validationResult.success) {
      return SimpleErrorHandler.handleApiError(request, createValidationError('Invalid request body'));
    }

    const input = validationResult.data;
    await logAudit(
      'INFO',
      `AI search request: "${input.query}"${input.positionId ? ` for position ${input.positionId}` : ''}`,
      'AI:SearchApplicants',
      user.id,
      input
    );

    const aiSearchResult = await searchApplicantsAIChat({ query: input.query });
    if (!aiSearchResult.matchedApplicantIds || aiSearchResult.matchedApplicantIds.length === 0) {
      return SimpleErrorHandler.createSuccessResponse(request, {
        data: [],
        total: 0,
        query: input.query,
        aiReasoning: aiSearchResult.aiReasoning || 'No Applicants found matching the search criteria',
      }, 200);
    }

    const detailResult = await fetchSearchApplicantDetails({
      query: input.query,
      matchedApplicantIds: aiSearchResult.matchedApplicantIds,
      aiReasoning: aiSearchResult.aiReasoning,
      positionId: input.positionId,
      limit: input.limit,
      offset: input.offset,
    });

    return SimpleErrorHandler.createSuccessResponse(request, {
      data: detailResult.data,
      total: detailResult.total,
      query: input.query,
      aiReasoning: aiSearchResult.aiReasoning,
      recordCount: aiSearchResult.recordCount,
    }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return SimpleErrorHandler.handleApiError(request, createInternalServerError(`AI search failed: ${errorMessage}`));
  }
}

export function handleSearchApplicantsV1Options(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
