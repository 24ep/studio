import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const jsonValueSchema = z.custom<Prisma.InputJsonValue>();
const jsonObjectSchema = z.record(jsonValueSchema);

const notificationBaseSchema = z.object({
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  data: jsonObjectSchema.optional(),
});

export const createNotificationSchema = notificationBaseSchema.extend({
  targetUserId: z.string().uuid().optional(),
}).strict();

export const bulkNotificationSchema = z.object({
  notifications: z.array(notificationBaseSchema.extend({
    targetUserId: z.string().uuid(),
  })).min(1, 'At least one notification is required').max(100, 'Maximum 100 notifications per request'),
}).strict();

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>;
