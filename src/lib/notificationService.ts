import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/auditLog';
import { broadcastNotification } from '@/lib/simple-broadcaster';

import {
  buildApplicantAddedNotification,
  buildApplicantStatusChangeNotification,
  buildRecruiterAssignedNotification,
} from './notification-service-builders';
import { createNotificationWithAudit } from './notification-service-create';
import type { NotificationData } from './notification-service-types';
import {
  assertValidNotificationUserId,
} from './notification-service-validation';

export type { NotificationData } from './notification-service-types';

export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  static async createNotification(
    userId: string,
    notification: NotificationData,
    actingUserId?: string
  ) {
    try {
      return await createNotificationWithAudit({
        actingUserId,
        broadcastNotification,
        createNotificationRecord: ({ userId: targetUserId, notification: notificationData }) =>
          prisma.notification.create({
            data: {
              userId: targetUserId,
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              data: notificationData.data || {},
            },
          }),
        logAudit,
        notification,
        userId,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification when a recruiter is assigned to a position
   */
  static async notifyRecruiterAssigned(
    positionId: string,
    positionTitle: string,
    recruiterId: string,
    assignedByUserId: string
  ) {
    return this.createNotification(
      recruiterId,
      buildRecruiterAssignedNotification({ positionId, positionTitle, assignedByUserId }),
      assignedByUserId
    );
  }

  /**
   * Create a notification when an applicant is added
   */
  static async notifyApplicantAdded(
    applicantId: string,
    applicantName: string,
    positionId: string,
    positionTitle: string,
    recruiterId: string,
    addedByUserId: string
  ) {
    return this.createNotification(
      recruiterId,
      buildApplicantAddedNotification({
        applicantId,
        applicantName,
        positionId,
        positionTitle,
        addedByUserId,
      }),
      addedByUserId
    );
  }

  /**
   * Create a notification when an applicant status changes
   */
  static async notifyApplicantStatusChange(
    applicantId: string,
    applicantName: string,
    oldStatus: string,
    newStatus: string,
    positionId: string,
    positionTitle: string,
    recruiterId: string,
    changedByUserId: string
  ) {
    return this.createNotification(
      recruiterId,
      buildApplicantStatusChangeNotification({
        applicantId,
        applicantName,
        oldStatus,
        newStatus,
        positionId,
        positionTitle,
        changedByUserId,
      }),
      changedByUserId
    );
  }

  /**
   * Get notifications for a user with pagination and filtering
   */
  static async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    isRead?: boolean
  ) {
    try {
      assertValidNotificationUserId(userId);

      const whereClause: Prisma.NotificationWhereInput = { userId };
      if (isRead !== undefined) {
        whereClause.isRead = isRead;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({
          where: whereClause,
        })
      ]);

      return {
        notifications,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      try {
        assertValidNotificationUserId(userId);
      } catch {
        return 0;
      }

      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      assertValidNotificationUserId(userId);

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}
