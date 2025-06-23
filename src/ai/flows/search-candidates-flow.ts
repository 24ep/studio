'use server';
/**
 * @fileOverview Genkit flow for AI-powered candidate search.
 *
 * - searchCandidatesAIChat - Performs a natural language search across candidate profiles.
 * - SearchCandidatesInput - Input schema for the search query.
 * - SearchCandidatesOutput - Output schema containing matched candidate IDs and AI reasoning.
 */

import { genkit as globalGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { getPool } from '@/lib/db';
import type { Candidate, CandidateDetails, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, TransitionRecord } from '@/lib/types';
import { ai as globalAi } from '@/ai/genkit';

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

// Enhanced helper to create a more comprehensive summary for a candidate
function createCandidateSummary(candidate: Candidate): string {
  const { id, name, email, phone, status, fitScore, position, parsedData, custom_attributes, applicationDate, recruiter, transitionHistory } = candidate;
  const details = parsedData as CandidateDetails | null;

  let summaryParts: string[] = [];
  summaryParts.push(`Candidate ID: ${id}`);
  summaryParts.push(`Name: ${name}`);
  if (email) summaryParts.push(`Email: ${email}`);
  if (phone) summaryParts.push(`Phone: ${phone}`);
  
  if (position?.title) summaryParts.push(`Applied for Position: ${position.title} (Fit Score: ${fitScore}%, Status: ${status})`);
  else summaryParts.push(`General Application (Status: ${status}, Overall Fit Score: ${fitScore}%)`);
  
  if (applicationDate) summaryParts.push(`Application Date: ${new Date(applicationDate).toLocaleDateString()}`);
  if (recruiter?.name) summaryParts.push(`Assigned Recruiter: ${recruiter.name}`);
  
  const latestTransition = transitionHistory?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (latestTransition) {
    summaryParts.push(`Last Status Update: ${latestTransition.stage} on ${new Date(latestTransition.date).toLocaleDateString()}`);
  }


  if (details) {
    if (details.cv_language) summaryParts.push(`CV Language: ${details.cv_language}`);
    
    if (details.personal_info) {
      const pi = details.personal_info;
      if (pi.title_honorific) summaryParts.push(`Title: ${pi.title_honorific}`);
      if (pi.nickname) summaryParts.push(`Nickname: ${pi.nickname}`);
      if (pi.location) summaryParts.push(`Location: ${pi.location}`);
      if (pi.introduction_aboutme) summaryParts.push(`About Me: ${pi.introduction_aboutme}`);
    }

    if (details.education && details.education.length > 0) {
      summaryParts.push("Education History:");
      details.education.forEach((edu: EducationEntry, index: number) => {
        let eduStr = `  ${index + 1}. University: ${edu.university || 'N/A'}`;
        if (edu.major || edu.field) eduStr += `, Major/Field: ${edu.major || ''}${edu.major && edu.field ? ' / ' : ''}${edu.field || ''}`;
        if (edu.campus) eduStr += `, Campus: ${edu.campus}`;
        if (edu.period) eduStr += `, Period: ${edu.period}`;
        if (edu.duration) eduStr += `, Duration: ${edu.duration}`;
        if (edu.GPA) eduStr += `, GPA: ${edu.GPA}`;
        summaryParts.push(eduStr);
      });
    }

    if (details.experience && details.experience.length > 0) {
      summaryParts.push("Work Experience:");
      details.experience.forEach((exp: ExperienceEntry, index: number) => {
        let expStr = `  ${index + 1}. Company: ${exp.company || 'N/A'}, Position: ${exp.position || 'N/A'}`;
        if (exp.postition_level) expStr += ` (Level: ${exp.postition_level})`;
        if (exp.period) expStr += `, Period: ${exp.period}`;
        if (exp.duration) expStr += `, Duration: ${exp.duration}`;
        if (exp.is_current_position) expStr += ` (Current Position)`;
        if (exp.description) expStr += `\n    Description: ${exp.description.substring(0, 250)}${exp.description.length > 250 ? '...' : ''}`;
        summaryParts.push(expStr);
      });
    }

    if (details.skills && details.skills.length > 0) {
      summaryParts.push("Skills:");
      details.skills.forEach((skillEntry: SkillEntry) => {
        let skillStr = `  - Segment: ${skillEntry.segment_skill || 'General'}: `;
        if (skillEntry.skill && skillEntry.skill.length > 0) {
          skillStr += skillEntry.skill.join(', ');
        } else if (skillEntry.skill_string) {
           skillStr += skillEntry.skill_string;
        } else {
            skillStr += "N/A";
        }
        summaryParts.push(skillStr);
      });
    }

    if (details.job_suitable && details.job_suitable.length > 0) {
        summaryParts.push("Job Suitability Preferences:");
        details.job_suitable.forEach((js: JobSuitableEntry, index: number) => {
            let jsStr = `  ${index + 1}. Career: ${js.suitable_career || 'N/A'}`;
            if (js.suitable_job_position) jsStr += `, Position: ${js.suitable_job_position}`;
            if (js.suitable_job_level) jsStr += `, Level: ${js.suitable_job_level}`;
            if (js.suitable_salary_bath_month) jsStr += `, Salary Expectation (THB/Month): ${js.suitable_salary_bath_month}`;
            summaryParts.push(jsStr);
        });
    }
    
    if (details.job_matches && details.job_matches.length > 0) {
      summaryParts.push("Automated Job Matches (from n8n):");
      details.job_matches.forEach(match => {
        summaryParts.push(`  - Job: ${match.job_title || match.job_id || 'N/A'}, Fit: ${match.fit_score}%, Reasons: ${(match.match_reasons || []).join(', ')}`);
      });
    }
  }
  
  if (custom_attributes && Object.keys(custom_attributes).length > 0) {
    summaryParts.push("Custom Attributes:");
    for (const [key, value] of Object.entries(custom_attributes)) {
        summaryParts.push(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }
  }

  const finalSummary = summaryParts.join('\n');
  return finalSummary;
}

// The main flow function
export async function searchCandidatesAIChat(input: SearchCandidatesInput): Promise<SearchCandidatesOutput> {
  let activeAi = globalAi;

  async function getSystemSetting(key: string): Promise<string | null> {
    const client = await getPool().connect();
    try {
      const res = await client.query('SELECT value FROM "SystemSetting" WHERE key = $1', [key]);
      if (res.rows.length > 0) {
        return res.rows[0].value;
      }
      return null;
    } finally {
      client.release();
    }
  }

  const dbApiKey = await getSystemSetting('geminiApiKey');

  if (dbApiKey) {
    console.log("AI Search: Using Gemini API Key from database for this flow instance.");
    const customGoogleAI = googleAI({ apiKey: dbApiKey });
    activeAi = globalGenkit({ plugins: [customGoogleAI], model: 'googleai/gemini-pro' });
  } else if (process.env.GOOGLE_API_KEY) {
    console.log("AI Search: Using GOOGLE_API_KEY environment variable (global Genkit instance).");
  } else {
    console.error('AI Search: Gemini API Key not configured. AI features unavailable.');
    return { matchedCandidateIds: [], aiReasoning: 'AI features are not available due to missing API Key configuration.' };
  }

  let allCandidates: Candidate[] = [];
  try {
    const candidatesResult = await getPool().query(`
        SELECT 
            c.*, 
            p.title as "positionTitle",
            rec.name as "recruiterName",
            COALESCE(th_data.history, '[]'::json) as "transitionHistory"
        FROM "candidates" c 
        LEFT JOIN "positions" p ON c."positionId" = p.id
        LEFT JOIN "User" rec ON c."recruiterId" = rec.id
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', th.id, 'date', th.date, 'stage', th.stage, 'notes', th.notes
            ) ORDER BY th.date DESC
          ) AS history
          FROM "TransitionRecord" th
          WHERE th."candidateId" = c.id
        ) AS th_data ON true
    `);

    allCandidates = candidatesResult.rows.map(row => ({
        ...row,
        parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
        position: row.positionId ? { id: row.positionId, title: row.positionTitle } : null,
        recruiter: row.recruiterId ? { id: row.recruiterId, name: row.recruiterName, email: null } : null,
        transitionHistory: (row.transitionHistory || []) as TransitionRecord[],
        custom_attributes: row.custom_attributes || {},
    })) as Candidate[];

    if (allCandidates.length === 0) {
      return { matchedCandidateIds: [], aiReasoning: "No candidates found in the database to search." };
    }
    console.log(`AI Search: Preparing to process ${allCandidates.length} candidate profiles.`);
  } catch (dbError) {
    console.error("AI Search: Error fetching candidates from DB:", dbError);
    return { matchedCandidateIds: [], aiReasoning: "Failed to retrieve candidate data for searching." };
  }

  const candidateSummariesText = allCandidates
    .map(c => `CANDIDATE_START\n${createCandidateSummary(c)}\nCANDIDATE_END`)
    .join('\n\n---\n\n');
  
  if (!candidateSummariesText.trim() && allCandidates.length > 0) {
      console.warn("AI Search: Candidate summaries text is empty even though candidates were fetched. This might indicate an issue with createCandidateSummary or empty candidate details.");
  }

  const effectiveCandidateData = candidateSummariesText.trim() ? candidateSummariesText : "No candidate details available for processing.";

  try {
    const llmResponse = await activeAi.generate({
      prompt: `You are an expert HR assistant. Your task is to analyze a list of candidate summaries based on a user's search query.
Identify the candidates that best match the query.

User Search Query:
${input.query}

Candidate Data (each candidate is between CANDIDATE_START and CANDIDATE_END):
${effectiveCandidateData}

When matching candidates to the user's query, you must consider ALL available candidate attributes, including (but not limited to):
- Name
- Contact information (email, phone)
- Education history (university, major, GPA, etc.)
- Work experience (companies, positions, durations, descriptions)
- Skills
- Fit score
- Position applied for
- Application date
- Recruiter
- Status and transition history
- Job suitability preferences
- Automated job matches
- Custom fields/attributes
- Any other data provided in the summary

Base your decision strictly on the provided candidate summaries and the user's query. Return a list of candidate IDs that are strong matches.
If no candidates seem to match, return an empty list for matchedCandidateIds.
Provide a brief reasoning for your selection or if no matches are found.
Ensure your output is in the specified JSON format.
If no candidate data is provided but a search query is present, indicate that no data was available to search.
`,
      output: {
        format: 'json',
        schema: SearchCandidatesOutputSchema,
      },
      config: {
        // Optional: add temperature or other settings if needed
        // temperature: 0.2,
      },
    });

    const result = llmResponse.output;
    if (!result) {
      console.warn("AI Search: LLM response output is null or undefined.");
      return { matchedCandidateIds: [], aiReasoning: "The AI model returned an empty response." };
    }

    let finalReasoning = result.aiReasoning;
    // Handle cases where the model returns matches but no reasoning text
    if ((result.matchedCandidateIds || []).length > 0 && (!finalReasoning || finalReasoning.trim() === '')) {
      finalReasoning = "The AI model identified matching candidates based on the query but did not provide specific reasoning.";
    }
    // Handle cases where model returns no matches and no reasoning
    if (input.query && effectiveCandidateData !== "No candidate details available for processing." && (result.matchedCandidateIds || []).length === 0 && (!finalReasoning || finalReasoning.trim() === '')) {
        finalReasoning = "The AI model reviewed the candidate data and found no strong matches for the specified query.";
    }

    return {
      matchedCandidateIds: result.matchedCandidateIds || [],
      aiReasoning: finalReasoning || "No reasoning provided by the AI.",
    };

  } catch (error) {
    console.error('AI Search Flow Error:', error);
    return {
      matchedCandidateIds: [],
      aiReasoning: `An unexpected error occurred during AI processing. Details: ${(error as Error).message}`
    };
  }
}
