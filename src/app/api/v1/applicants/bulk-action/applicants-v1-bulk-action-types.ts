import { z } from 'zod';
import { updateApplicantSchema } from '../[id]/applicant-v1-detail-schema';

export const v1ApplicantsBulkActionSchema = z.object({
  action: z.enum(['delete', 'update_status', 'assign_recruiter', 'assign_position']),
  applicantIds: z.array(z.string().uuid()),
  data: updateApplicantSchema.optional(),
});

export type V1ApplicantsBulkActionInput = z.infer<typeof v1ApplicantsBulkActionSchema>;
export type V1ApplicantsBulkAction = V1ApplicantsBulkActionInput['action'];

export type V1BulkActionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  modulePermissions?: string[];
};

export type V1BulkActionApplicantPermissionRow = {
  id: string;
  recruiterId: string | null;
};
