import { z } from 'zod';

export type ApplicantSourceRouteContext = {
  params: Promise<{ id: string }>;
};

export const updateApplicantSourceSchema = z.object({
  sourceId: z.string().uuid().nullable().optional(),
  subSource: z.string().optional().nullable(),
});

export type UpdateApplicantSourceInput = z.infer<typeof updateApplicantSourceSchema>;

export async function resolveApplicantSourceParams(context: ApplicantSourceRouteContext) {
  const { id } = await context.params;
  return { applicantId: id };
}
