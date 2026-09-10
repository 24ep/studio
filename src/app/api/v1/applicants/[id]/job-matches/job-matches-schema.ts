import { normalizePayloadTypes } from '@/lib/apiUtils';
import { readRequestJsonResult } from '@/lib/request-json';
import { z } from 'zod';

export const jobMatchSchema = z.object({
  fitScore: z.number().min(0).max(1).optional(),
  jobId: z.string().uuid().optional(),
  matchReasons: z.array(z.string()).optional().default([]),
});

export const jobMatchesUpdateSchema = z.object({
  job_matches: z.array(jobMatchSchema).optional(),
});

export type JobMatchInput = z.infer<typeof jobMatchSchema>;
export type JobMatchesPayload = z.infer<typeof jobMatchesUpdateSchema>;

export async function parseJobMatchesPayload(request: Request, shouldNormalize = true) {
  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return {
        ok: false as const,
        body: {
          error: 'Invalid input',
          code: 'BAD_REQUEST',
          endpoint: '/api/v1/applicants/[id]/job-matches',
          details: { message: 'Invalid JSON body' },
        },
      };
    }

    const body = shouldNormalize ? normalizePayloadTypes(bodyResult.value) : bodyResult.value;
    const validationResult = jobMatchesUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return {
        ok: false as const,
        body: {
          error: 'Invalid input',
          code: 'BAD_REQUEST',
          endpoint: '/api/v1/applicants/[id]/job-matches',
          details: validationResult.error.flatten().fieldErrors,
        },
      };
    }

    return {
      ok: true as const,
      payload: validationResult.data,
    };
  } catch {
    return {
      ok: false as const,
      body: {
        error: 'Invalid input',
        code: 'BAD_REQUEST',
        endpoint: '/api/v1/applicants/[id]/job-matches',
        details: { message: 'Invalid JSON body' },
      },
    };
  }
}
