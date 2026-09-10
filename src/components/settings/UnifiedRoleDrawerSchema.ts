import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional().nullable(),
  is_default: z.boolean().optional().default(false),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const roleFormResolver = zodResolver(roleFormSchema);

export const EMPTY_ROLE_FORM_VALUES: RoleFormValues = {
  name: '',
  description: '',
  is_default: false,
};

export interface AvailableRoleUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export function getValidRolePermissions(permissions: unknown): string[] {
  return Array.isArray(permissions)
    ? permissions.filter(permission => typeof permission === 'string' && permission.length > 0)
    : [];
}
