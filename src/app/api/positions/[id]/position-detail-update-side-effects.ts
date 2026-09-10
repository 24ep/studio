import { dispatchWebhooks } from '@/lib/webhookDispatcher';
import { syncRecruiterForPosition } from '@/lib/recruiterSync';
import { NotificationService } from '@/lib/notificationService';
import { broadcastPositionUpdate } from '@/lib/simple-broadcaster';
import type { PositionDetailRow } from './position-detail-data';
import { type UpdatePositionInput } from './position-detail-schema';

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = 5000): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function syncRecruiterAssignmentAfterPositionUpdate(
  id: string,
  enrichedPosition: PositionDetailRow,
  updateData: UpdatePositionInput,
  oldRecruiterId: string | null | undefined,
  actingUserId: string,
  actingUserName: string
) {
  if (updateData.recruiterId === undefined || updateData.recruiterId === oldRecruiterId) {
    return null;
  }

  try {
    const syncResult = await withTimeout(
      syncRecruiterForPosition(id, actingUserId, actingUserName),
      'Sync operation timed out'
    );

    if (updateData.recruiterId) {
      try {
        await withTimeout(
          NotificationService.notifyRecruiterAssigned(
            id,
            enrichedPosition.title,
            updateData.recruiterId,
            actingUserId
          ),
          'Notification timed out'
        );
      } catch (notificationError) {
        console.error('Failed to send recruiter assignment notification:', notificationError);
      }
    }

    return syncResult;
  } catch (syncError) {
    console.error('Failed to assign recruiters after position update:', syncError);
    return {
      positionId: id,
      positionTitle: enrichedPosition.title,
      applicantsUpdated: 0,
      applicantsSkipped: 0,
      errors: [syncError instanceof Error ? syncError.message : 'Unknown sync error'],
    };
  }
}

export function publishPositionUpdated(positionWithCustomAttrs: PositionDetailRow & { custom_attributes: unknown }, actingUserId: string) {
  try {
    dispatchWebhooks.positionUpdated(positionWithCustomAttrs).catch((error) => {
      console.error('Failed to dispatch position update webhook:', error);
    });
  } catch (webhookError) {
    console.error('Failed to dispatch position update webhook:', webhookError);
  }

  broadcastPositionUpdate(positionWithCustomAttrs, actingUserId || undefined);
}
