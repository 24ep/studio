import { z } from 'zod';

export type ApplicantRecruiterRouteContext = {
  params: Promise<{ id: string }>;
};

export const updateRecruiterSchema = z.object({
  recruiterId: z.string().uuid().nullable(),
});

export type UpdateRecruiterInput = z.infer<typeof updateRecruiterSchema>;
