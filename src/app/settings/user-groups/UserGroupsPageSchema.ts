import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional().default([]),
  is_default: z.boolean().optional().default(false),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
