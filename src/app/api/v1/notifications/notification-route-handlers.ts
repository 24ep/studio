import type { NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { createInternalServerError, createValidationError, SimpleErrorHandler } from '@/lib/errors';
import { NotificationService } from '@/lib/notificationService';
import type { VerifiedApiToken } from '@/lib/auth';
import { bulkNotificationSchema, createNotificationSchema } from './notification-route-schemas';
import {
  formatNotificationValidationErrors,
  getNotificationActingUserName,
  getNotificationRouteErrorMessage,
  parseNotificationListParams,
} from './notification-route-utils';

export async function handleBulkNotificationRequest(
  request: NextRequest,
  body: unknown,
  user: VerifiedApiToken
) {
  const validationResult = bulkNotificationSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = formatNotificationValidationErrors(validationResult.error.flatten().fieldErrors);
    return SimpleErrorHandler.handleApiError(request, createValidationError(`Invalid input - ${errorMsg}`));
  }

  const notifications = validationResult.data.notifications;
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const notification of notifications) {
    try {
      await NotificationService.createNotification(
        notification.targetUserId,
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
        },
        user.id
      );
      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send notification to ${notification.targetUserId}: ${getNotificationRouteErrorMessage(error)}`);
    }
  }

  await logAudit(
    'AUDIT',
    `Bulk notifications sent by ${getNotificationActingUserName(user)}. Sent: ${results.sent}, Failed: ${results.failed}`,
    'API:V1:Notifications:Bulk',
    user.id,
    {
      totalNotifications: notifications.length,
      results,
    }
  );

  return SimpleErrorHandler.createSuccessResponse(request, {
    message: 'Bulk notifications processed',
    results,
  });
}

export async function handleSingleNotificationRequest(
  request: NextRequest,
  body: unknown,
  user: VerifiedApiToken
) {
  const validationResult = createNotificationSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = formatNotificationValidationErrors(validationResult.error.flatten().fieldErrors);
    return SimpleErrorHandler.handleApiError(request, createValidationError(`Invalid input - ${errorMsg}`));
  }

  const { type, title, message, targetUserId, data } = validationResult.data;
  const targetUser = targetUserId || user.id;

  if (targetUser === user.id) {
    await logAudit(
      'AUDIT',
      `Self-notification prevented for ${getNotificationActingUserName(user)}`,
      'API:V1:Notifications:Create',
      user.id,
      {
        notificationType: type,
        title,
        targetUserId: targetUser,
        hasData: Boolean(data),
      }
    );
    return SimpleErrorHandler.createSuccessResponse(request, {
      message: 'Self-notification prevented',
      notification: null,
    });
  }

  try {
    const notification = await NotificationService.createNotification(
      targetUser,
      {
        type,
        title,
        message,
        data: data || {},
      },
      user.id
    );

    await logAudit(
      'AUDIT',
      `Notification '${title}' sent by ${getNotificationActingUserName(user)} to ${targetUser}`,
      'API:V1:Notifications:Create',
      user.id,
      {
        notificationType: type,
        title,
        targetUserId: targetUser,
        hasData: Boolean(data),
      }
    );

    return SimpleErrorHandler.createSuccessResponse(request, {
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error) {
    const errorMessage = getNotificationRouteErrorMessage(error);
    await logAudit(
      'ERROR',
      `Failed to send notification by ${getNotificationActingUserName(user)}. Error: ${errorMessage}`,
      'API:V1:Notifications:Create',
      user.id,
      {
        error: errorMessage,
        notificationData: { type, title, message, targetUserId },
      }
    );

    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Error sending notification: ${errorMessage}`)
    );
  }
}

export async function handleNotificationListRequest(request: NextRequest, user: VerifiedApiToken) {
  const { limit, offset, isRead } = parseNotificationListParams(request.url);

  try {
    const notifications = await NotificationService.getNotifications(
      user.id,
      limit,
      offset,
      isRead ? isRead === 'true' : undefined
    );

    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return SimpleErrorHandler.createSuccessResponse(request, {
      notifications: notifications.notifications,
      total: notifications.total,
      unreadCount,
    });
  } catch (error) {
    const errorMessage = getNotificationRouteErrorMessage(error);
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Error fetching notifications: ${errorMessage}`)
    );
  }
}
