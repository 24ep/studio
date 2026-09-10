import { type NextRequest } from 'next/server';
import { z } from 'zod';

export type ApplicantExportRouteContext = {
  params: Promise<{ id: string }>;
};

const uuidSchema = z.string().uuid();

export async function resolveApplicantExportId(_request: NextRequest, context: ApplicantExportRouteContext) {
  const { id } = await context.params;

  if (!uuidSchema.safeParse(id).success) {
    console.error('Invalid Applicant ID format:', id);
    return { ok: false as const, id };
  }

  return { ok: true as const, id };
}
