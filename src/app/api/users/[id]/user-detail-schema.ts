import { z } from 'zod';

export type UserDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export const USER_ROLE_TO_GROUP_ID = {
  Admin: '00000000-0000-0000-0000-000000000001',
  Recruiter: '00000000-0000-0000-0000-000000000002',
  'Hiring Manager': '00000000-0000-0000-0000-000000000003',
  Employee: '00000000-0000-0000-0000-000000000005',
} as const;

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('A valid email is required').optional(),
  role: z.enum(['Admin', 'Recruiter', 'Hiring Manager', 'Employee']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  authenticationMethods: z.array(z.string()).optional(),
  forcePasswordChange: z.boolean().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional().or(z.literal('')),
  userTeamIds: z.array(z.string().uuid()).optional(),
  userGroupIds: z.array(z.string().uuid()).optional(),
  avatarUrl: z.string().optional(),
  personalColor: z.string().optional(),
  positionTitle: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  officeLocation: z.string().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export type UserRole = keyof typeof USER_ROLE_TO_GROUP_ID;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
