import { z } from 'zod';

export const sendInvitationSchema = z.object({
  interviewerIds: z.array(z.string().uuid()).optional(),
  interviewDate: z.string().datetime(),
  interviewTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().int().min(15).max(480).default(60),
  location: z.string().optional(),
  locationEmail: z.string().email().optional(),
  notes: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;

export type SendInvitationContext = {
  params: Promise<{ id: string }>;
};

export interface InterviewerRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
}
