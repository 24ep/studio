import { z } from 'zod';

export type JobMatchDetailRouteContext = {
  params: Promise<{ id: string; matchId: string }>;
};

export const jobMatchDetailSchema = z.object({
  fitScore: z.number().min(0).max(1),
  jobId: z.string().uuid(),
  matchReasons: z.array(z.string()).optional().default([]),
});

export type JobMatchDetailInput = z.infer<typeof jobMatchDetailSchema>;

export async function resolveJobMatchDetailParams(context: JobMatchDetailRouteContext) {
  const { id, matchId } = await context.params;
  return {
    applicantId: id,
    matchId,
  };
}
