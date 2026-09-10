import { z } from 'zod';

export type ApplicantSourceDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export const updateApplicantSourceSchema = z.object({
  name: z.string().min(1, 'Source name is required').optional(),
  description: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  allowSubSource: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateApplicantSourceInput = z.infer<typeof updateApplicantSourceSchema>;

export type ApplicantSourceRow = {
  id: string;
  name: string;
  description?: string | null;
  email?: string | null;
  logo?: string | null;
  allowSubSource?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
