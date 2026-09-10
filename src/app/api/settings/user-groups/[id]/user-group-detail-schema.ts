import { z } from 'zod';

export type UserGroupDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export const userGroupUpdateSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.').optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
  is_default: z.boolean().optional(),
});

export type UserGroupUpdateInput = z.infer<typeof userGroupUpdateSchema>;
