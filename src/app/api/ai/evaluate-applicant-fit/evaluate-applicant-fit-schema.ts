import { z } from 'zod';

export const DEFAULT_EVALUATION_PROMPT = [
  'Evaluate the applicant against the selected position using resume evidence, parsed resume data, configured position criteria, existing fit scores, match reasons, recruiter notes, and evaluation feedback.',
  'Return a fair, evidence-based score and concise justification bullets. Use specific language, call out strengths and risks, and do not invent qualifications that are not present in the data.',
].join(' ');

export const evaluateApplicantFitSchema = z.object({
  applicantId: z.string().uuid(),
  positionId: z.string().uuid().optional(),
  save: z.boolean().optional().default(false),
  promptOverride: z.string().trim().min(20).optional(),
});

export type EvaluateApplicantFitInput = z.infer<typeof evaluateApplicantFitSchema>;

export type AiEvaluationResult = {
  fitScore: number;
  justification: string[];
  summary?: string;
  strengths?: string[];
  risks?: string[];
  evidence?: string[];
};
