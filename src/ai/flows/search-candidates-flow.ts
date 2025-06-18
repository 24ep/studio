
'use server';
/**
 * @fileOverview Genkit flow for AI-powered candidate search.
 *
 * - searchCandidatesAIChat - Performs a natural language search across candidate profiles.
 * - SearchCandidatesInput - Input schema for the search query.
 * - SearchCandidatesOutput - Output schema containing matched candidate IDs and AI reasoning.
 */

import { genkit as globalGenkit } from 'genkit'; // Use 'globalGenkit' to avoid conflict if 'ai' is redefined locally
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit/zod';
import pool, { getSystemSetting } from '@/lib/db';
import type { Candidate, CandidateDetails, ExperienceEntry } from '@/lib/types';
import { ai as globalAi } from '@/ai/genkit'; // The global Genkit instance

// Input Schema
const SearchCandidatesInputSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters long."),
});
export type SearchCandidatesInput = z.infer<typeof SearchCandidatesInputSchema>;

// Output Schema
const SearchCandidatesOutputSchema = z.object({
  matchedCandidateIds: z.array(z.string().uuid()).describe("An array of UUIDs of candidates that match the search query."),
  aiReasoning: z.string().optional().describe("A brief explanation from the AI on why these candidates were matched or if no matches were found."),
});
export type SearchCandidatesOutput = z.infer<typeof SearchCandidatesOutputSchema>;

// Helper to create a concise summary for a candidate
function createCandidateSummary(candidate: Candidate): string {
  const { id, name, email, phone, status, fitScore, position, parsedData } = candidate;
  const details = parsedData as CandidateDetails | null;

  let summaryParts: string[] = [];
  summaryParts.push(`ID: ${id}`);
  summaryParts.push(`Name: ${name}`);
  if (email) summaryParts.push(`Email: ${email}`);
  if (phone) summaryParts.push(`Phone: ${phone}`);
  if (position?.title) summaryParts.push(`Applied for: ${position.title} (Fit: ${fitScore}%, Status: ${status})`);
  else summaryParts.push(`Status: ${status}, General Fit: ${fitScore}%`);

  if (details) {
    if (details.personal_info?.location) summaryParts.push(`Location: ${details.personal_info.location}`);
    if (details.personal_info?.introduction_aboutme) summaryParts.push(`About: ${details.personal_info.introduction_aboutme.substring(0, 150)}...`);

    if (details.education && details.education.length > 0) {
      const eduHighlight = details.education.map(edu => `${edu.major || edu.field || ''} at ${edu.university || ''} (${edu.period || ''})`).join('; ');
      if (eduHighlight.trim()) summaryParts.push(`Education: ${eduHighlight}`);
    }

    if (details.experience && details.experience.length > 0) {
      const expSummary = details.experience.map(exp => `${exp.position} at ${exp.company} (${exp.period || exp.duration || 'N/A'})`).slice(0, 2).join('; ');
      // Basic total experience calculation (very rough)
      let totalYears = 0;
      details.experience.forEach(exp => {
        if (exp.duration) {
          const match = exp.duration.match(/(\d+)\s*y/i);
          if (match && match[1]) totalYears += parseInt(match[1]);
        }
      });
      if (totalYears > 0) summaryParts.push(`Experience: ${expSummary} (Total approx. ${totalYears} years)`);
      else if (expSummary.trim()) summaryParts.push(`Experience: ${expSummary}`);
    }

    if (details.skills && details.skills.length > 0) {
      const allSkills = details.skills.flatMap(sEntry => sEntry.skill || []).slice(0, 10).join(', ');
      if (allSkills.trim()) summaryParts.push(`Key Skills: ${allSkills}`);
    }
  }
  return summaryParts.join('\n');
}

// The main flow function
export async function searchCandidatesAIChat(input: SearchCandidatesInput): Promise<SearchCandidatesOutput> {
  let activeAi = globalAi; // Use global 'ai' by default

  const dbApiKey = await getSystemSetting('geminiApiKey');

  if (dbApiKey) {
    console.log("AI Search: Using Gemini API Key from database.");
    const customGoogleAI = googleAI({ apiKey: dbApiKey });
    // Re-initialize a local genkit instance if DB key is found
    activeAi = globalGenkit({ plugins: [customGoogleAI], model: 'googleai/gemini-pro' });
  } else if (process.env.GOOGLE_API_KEY) {
    console.log("AI Search: Using GOOGLE_API_KEY environment variable.");
    // Global 'ai' will use this by default.
  } else {
    console.error('AI Search: Gemini API Key not configured in database or GOOGLE_API_KEY env var not set.');
    return { matchedCandidateIds: [], aiReasoning: 'AI features are not available due to missing API Key configuration.' };
  }

  let allCandidates: Candidate[] = [];
  try {
    // Fetch ALL candidates - for a production system with many candidates, this needs optimization (e.g., pre-filtering or RAG)
    const candidatesResult = await pool.query(`
        SELECT c.*, p.title as "positionTitle" 
        FROM "Candidate" c 
        LEFT JOIN "Position" p ON c."positionId" = p.id
    `);
    allCandidates = candidatesResult.rows.map(row => ({
        ...row,
        parsedData: row.parsedData || { personal_info: {}, contact_info: {} }, // Ensure parsedData is at least an empty object
        position: row.positionId ? { id: row.positionId, title: row.positionTitle } : null, // simplified position
    })) as Candidate[];

    if (allCandidates.length === 0) {
      return { matchedCandidateIds: [], aiReasoning: "No candidates found in the database to search." };
    }
  } catch (dbError) {
    console.error("AI Search: Error fetching candidates from DB:", dbError);
    return { matchedCandidateIds: [], aiReasoning: "Failed to retrieve candidate data for searching." };
  }

  const candidateSummariesText = allCandidates
    .map(c => `CANDIDATE_START\n${createCandidateSummary(c)}\nCANDIDATE_END`)
    .join('\n\n---\n\n');

  const searchPrompt = activeAi.definePrompt(
    {
      name: 'candidateSearcherPrompt',
      input: { schema: z.object({ searchQuery: z.string(), candidateData: z.string() }) },
      output: { schema: SearchCandidatesOutputSchema },
      prompt: `You are an expert HR assistant. Your task is to analyze a list of candidate summaries based on a user's search query.
Identify the candidates that best match the query.

User Search Query:
{{searchQuery}}

Candidate Data (each candidate is between CANDIDATE_START and CANDIDATE_END):
{{candidateData}}

Based *only* on the provided candidate summaries and the user's query, return a list of candidate IDs that are strong matches.
If no candidates seem to match, return an empty list for matchedCandidateIds.
Provide a brief reasoning for your selection or if no matches are found.
Ensure your output is in the specified JSON format.
`,
    },
    async (params) => {
      // The 'generate' call is now within the callback, using the 'activeAi' instance
      const llmResponse = await activeAi.generate({
        prompt: params.prompt!, // The template string is already compiled into params.prompt
        history: params.history,
        config: params.config,
        input: params.input, // Pass structured input here
        output: {
          format: 'json',
          schema: SearchCandidatesOutputSchema,
        },
        // model: 'googleai/gemini-pro' // Specify model if not default in activeAi
      });
      return llmResponse.output!;
    }
  );
  
  try {
    const result = await searchPrompt({ searchQuery: input.query, candidateData: candidateSummariesText });
    return result || { matchedCandidateIds: [], aiReasoning: "AI model did not return a valid response." };
  } catch (flowError) {
    console.error("AI Search: Error executing Genkit flow:", flowError);
    return { matchedCandidateIds: [], aiReasoning: `AI search failed: ${(flowError as Error).message}` };
  }
}
