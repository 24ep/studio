import * as z from 'zod';
import type { CustomFieldValues } from '@/lib/types';

export const unifiedUserFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long").optional().or(z.literal('')),
    role: z.string().min(1, "Role is required").optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters").optional().or(z.literal('')),
    forcePasswordChange: z.boolean().optional().default(false),
    authenticationMethods: z.array(z.string()).min(1, "At least one authentication method is required").default(['basic']),
    userTeamIds: z.array(z.string()).optional().default([]),
    userGroupIds: z.array(z.string()).optional().default([]),
    avatarUrl: z.string().optional(),
    personalColor: z.string().optional(),
    positionTitle: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    officeLocation: z.string().optional().nullable(),
});

export type UnifiedUserFormValues = z.infer<typeof unifiedUserFormSchema>;

export type ModalMode = 'create' | 'edit' | 'profile';

export type UnifiedUserCustomFields = CustomFieldValues;
export type UnifiedUserPreferenceUpdates = Record<string, unknown>;

export interface UnifiedUserAzureAdUser {
    displayName?: unknown;
    jobTitle?: unknown;
    department?: unknown;
    officeLocation?: unknown;
    mobilePhone?: unknown;
}
