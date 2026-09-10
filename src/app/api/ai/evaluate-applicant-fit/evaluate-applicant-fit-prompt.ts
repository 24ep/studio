import type { EvaluateFitContext } from './evaluate-applicant-fit-data';

export function buildEvaluationPrompt(configuredPrompt: string, context: EvaluateFitContext) {
  const contextJson = JSON.stringify(context, null, 2);
  const templatedPrompt = configuredPrompt
    .replace(/\{applicantData\}/g, contextJson)
    .replace(/\{positionData\}/g, JSON.stringify(context.position, null, 2))
    .replace(/\{resumeData\}/g, JSON.stringify(context.applicant.parsedData || {}, null, 2))
    .replace(/\{evaluationData\}/g, JSON.stringify(context.interviewerEvaluations, null, 2));

  return `${templatedPrompt}

APPLICANT, RESUME, POSITION, MATCH, COMMENT, AND EVALUATION CONTEXT:
${contextJson}

Return only valid JSON with this exact shape:
{
  "fitScore": 0.82,
  "justification": ["specific evidence-based reason", "specific evidence-based reason"],
  "summary": "one concise hiring assessment",
  "strengths": ["strength"],
  "risks": ["risk or gap"],
  "evidence": ["resume or evaluation evidence used"]
}

Rules:
- fitScore must be a decimal from 0 to 1.
- justification must contain 3 to 6 concise bullets.
- Base the score on resume evidence and selected position criteria.
- If evidence is missing, lower confidence and mention the gap.
- Do not include markdown or prose outside the JSON object.`;
}
