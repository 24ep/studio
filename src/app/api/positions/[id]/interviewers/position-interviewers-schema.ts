import { z } from 'zod';

export type PositionInterviewersRouteContext = {
  params: Promise<{ id: string }>;
};

export const addInterviewerSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').min(1, 'User ID is required'),
});

export type AddInterviewerInput = z.infer<typeof addInterviewerSchema>;
