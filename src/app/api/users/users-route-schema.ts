import { z } from 'zod';

export const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager', 'Employee']);

const optionalNonBlankString = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().optional()
);

const optionalNonBlankStringWithDefault = (defaultValue: string) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().optional()
).transform((value) => value || defaultValue);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(8, 'Password must be at least 8 characters long').optional()
  ),
  role: optionalNonBlankString,
  userTeamIds: z.array(z.string().uuid()).optional().default([]),
  userGroupIds: z.array(z.string().uuid()).optional().default([]),
  authenticationMethods: z.array(z.string()).optional().default(['basic']),
  forcePasswordChange: z.boolean().optional().default(false),
  personalColor: optionalNonBlankStringWithDefault('#3B82F6'),
  positionTitle: optionalNonBlankString.nullable(),
  department: optionalNonBlankString.nullable(),
  officeLocation: optionalNonBlankString.nullable(),
  employeeType: optionalNonBlankString.nullable(),
  companyName: optionalNonBlankString.nullable(),
  manager: optionalNonBlankString.nullable(),
  phoneNumber: optionalNonBlankString.nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserRole = z.infer<typeof userRoleEnum>;
