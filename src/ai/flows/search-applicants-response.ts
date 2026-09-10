const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_GLOBAL_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function extractJsonText(modelText: string) {
  let jsonText = modelText.trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : jsonText;
}

export function parseSearchApplicantsResponse(modelText: string) {
  try {
    const result = JSON.parse(extractJsonText(modelText));
    return {
      matchedApplicantIds: Array.isArray(result.matchedApplicantIds) ? result.matchedApplicantIds : [],
      aiReasoning: typeof result.aiReasoning === 'string' ? result.aiReasoning : '',
    };
  } catch {
    return {
      matchedApplicantIds: modelText.match(UUID_GLOBAL_PATTERN) || [],
      aiReasoning: `Failed to parse AI response as JSON. Raw response: ${modelText.substring(0, 200)}${modelText.length > 200 ? '...' : ''}`,
    };
  }
}

export function buildSearchApplicantsOutput({
  applicantDataAvailable,
  modelText,
  query,
}: {
  applicantDataAvailable: boolean;
  modelText: string;
  query: string;
}) {
  const result = parseSearchApplicantsResponse(modelText);
  const sanitizedApplicantIds = (result.matchedApplicantIds || [])
    .filter((id: unknown) => typeof id === 'string' && UUID_PATTERN.test(id))
    .slice(0, 50);

  let finalReasoning = result.aiReasoning;
  if (sanitizedApplicantIds.length > 0 && (!finalReasoning || finalReasoning.trim() === '')) {
    finalReasoning = 'The AI model identified matching Applicants based on the query but did not provide specific reasoning.';
  }
  if (query && applicantDataAvailable && sanitizedApplicantIds.length === 0 && (!finalReasoning || finalReasoning.trim() === '')) {
    finalReasoning = 'The AI model reviewed the Applicant data and found no strong matches for the specified query.';
  }

  return {
    matchedApplicantIds: sanitizedApplicantIds,
    aiReasoning: finalReasoning || 'No reasoning provided by the AI.',
    recordCount: sanitizedApplicantIds.length,
  };
}
