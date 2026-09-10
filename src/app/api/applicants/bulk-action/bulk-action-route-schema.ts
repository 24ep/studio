import { z } from 'zod';

export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'change_status', 'assign_recruiter', 'reprocess']),
  applicantIds: z.array(z.string().uuid()).min(1, 'At least one Applicant ID is required.'),
  newStatus: z.string().optional(),
  newRecruiterId: z.string().uuid().nullable().optional(),
  transitionNotes: z.string().optional().nullable(),
}).refine((data) => {
  return data.action !== 'change_status' || Boolean(data.newStatus);
}, {
  message: "newStatus is required when action is 'change_status'",
  path: ['newStatus'],
});

export type BulkActionRequest = z.infer<typeof bulkActionSchema>;
export type BulkActionType = BulkActionRequest['action'];
