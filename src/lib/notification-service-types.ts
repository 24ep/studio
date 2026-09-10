import type { Prisma } from '@prisma/client';

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Prisma.InputJsonObject;
}
