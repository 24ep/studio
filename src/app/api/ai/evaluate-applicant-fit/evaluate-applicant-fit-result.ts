import type { AiEvaluationResult } from './evaluate-applicant-fit-schema';

export function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 200)}`);
    }
    return JSON.parse(objectMatch[0]);
  }
}

export function normalizeEvaluationResult(value: unknown): AiEvaluationResult {
  if (!value || typeof value !== 'object') {
    throw new Error('AI evaluation response was empty or invalid.');
  }

  const result = value as Partial<AiEvaluationResult>;
  const rawScore = Number(result.fitScore);
  if (!Number.isFinite(rawScore)) {
    throw new Error('AI evaluation response did not include a numeric fitScore.');
  }

  const fitScore = Math.max(0, Math.min(1, rawScore > 1 ? rawScore / 100 : rawScore));
  const justification = normalizeStringArray(result.justification);

  if (justification.length === 0) {
    justification.push('AI generated a score but did not provide detailed justification.');
  }

  return {
    fitScore,
    justification,
    summary: typeof result.summary === 'string' ? result.summary.trim() : undefined,
    strengths: normalizeStringArray(result.strengths),
    risks: normalizeStringArray(result.risks),
    evidence: normalizeStringArray(result.evidence),
  };
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n\r]+|(?:^|\s)[-\u2022]\s+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}
