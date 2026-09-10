import { z } from 'zod';

export type UserTeamMembersRouteContext = {
  params: Promise<{ id: string }>;
};

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
