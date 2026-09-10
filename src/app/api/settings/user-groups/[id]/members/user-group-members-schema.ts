import { z } from 'zod';

export type UserGroupMembersRouteContext = {
  params: Promise<{ id: string }>;
};

export const groupMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type GroupMemberInput = z.infer<typeof groupMemberSchema>;
