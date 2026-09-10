/**
 * @fileOverview Provider-aware AI flow for Applicant search.
 *
 * - searchApplicantsAIChat - Performs a natural language search across Applicant profiles.
 * - SearchApplicantsInput - Input schema for the search query.
 * - SearchApplicantsOutput - Output schema containing matched Applicant IDs and AI reasoning.
 */

import { z } from 'zod';

import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { fetchSearchApplicants, getSearchSystemSetting } from './search-applicants-data';
import { buildSearchApplicantsPrompt } from './search-applicants-prompt';
import { buildSearchApplicantsOutput } from './search-applicants-response';
import { buildApplicantSummariesText } from './search-applicants-summary';

const EMPTY_APPLICANT_DATA = 'No Applicant details available for processing.';

const SearchApplicantsInputSchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters long.'),
});
export type SearchApplicantsInput = z.infer<typeof SearchApplicantsInputSchema>;

const SearchApplicantsOutputSchema = z.object({
  matchedApplicantIds: z.array(z.string()).describe('An array of UUIDs of Applicants that match the search query.'),
  aiReasoning: z.string().optional().describe('A brief explanation from the AI on why these Applicants were matched or if no matches were found.'),
  recordCount: z.number().describe('The count of records found by the AI search.'),
});
export type SearchApplicantsOutput = z.infer<typeof SearchApplicantsOutputSchema>;

export async function searchApplicantsAIChat(input: SearchApplicantsInput): Promise<SearchApplicantsOutput> {
  let applicantSummariesText = '';

  try {
    const applicants = await fetchSearchApplicants();
    if (applicants.length === 0) {
      return {
        matchedApplicantIds: [],
        aiReasoning: 'No Applicants found in the database to search.',
        recordCount: 0,
      };
    }

    applicantSummariesText = await buildApplicantSummariesText(applicants);
  } catch {
    return {
      matchedApplicantIds: [],
      aiReasoning: 'Failed to retrieve Applicant data for searching.',
      recordCount: 0,
    };
  }

  const effectiveApplicantData = applicantSummariesText.trim()
    ? applicantSummariesText
    : EMPTY_APPLICANT_DATA;

  try {
    const prompt = buildSearchApplicantsPrompt({
      applicantData: effectiveApplicantData,
      customSystemPrompt: await getSearchSystemSetting('aiPowerSearchSystemPrompt'),
      query: input.query,
    });

    const apiResult = await executeWithApiKeyFallback(
      async (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, prompt),
      'AI Search'
    );

    if (!apiResult.success) {
      return {
        matchedApplicantIds: [],
        aiReasoning: `AI features are not available because all configured ${getProviderLabel(apiResult.provider)} keys failed. Attempts: ${apiResult.attempts}, Last error: ${apiResult.error}`,
        recordCount: 0,
      };
    }

    return buildSearchApplicantsOutput({
      applicantDataAvailable: effectiveApplicantData !== EMPTY_APPLICANT_DATA,
      modelText: apiResult.data || '',
      query: input.query,
    });
  } catch (error) {
    return {
      matchedApplicantIds: [],
      aiReasoning: `An unexpected error occurred during AI processing. Details: ${(error as Error).message}`,
      recordCount: 0,
    };
  }
}
