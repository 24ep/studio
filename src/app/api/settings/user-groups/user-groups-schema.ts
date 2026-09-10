import { z } from 'zod';

export const userGroupCreateSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.'),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
  is_default: z.boolean().optional(),
});

export type UserGroupCreateInput = z.infer<typeof userGroupCreateSchema>;
