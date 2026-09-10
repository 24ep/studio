import { z } from 'zod';

export type JobAppliedV1RouteContext = {
  params: Promise<{ id: string }>;
};

export const jobAppliedSchema = z.object({
  fitScore: z.number().min(0).max(1),
  jobId: z.string().uuid(),
  justification: z.array(z.string()).optional().default([]),
});

export type JobAppliedInput = z.infer<typeof jobAppliedSchema>;
