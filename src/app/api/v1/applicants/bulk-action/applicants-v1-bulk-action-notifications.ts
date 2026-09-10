import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';

export async function notifyV1BulkActionAssignedRecruiter(
  applicantId: string,
  positionId: string,
  position: { title: string; recruiterId: string },
  actingUserId: string
) {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: { name: true },
    });

    if (!applicant) {
      return;
    }

    await NotificationService.notifyApplicantAdded(
      applicantId,
      applicant.name,
      positionId,
      position.title,
      position.recruiterId,
      actingUserId
    );
  } catch (notificationError) {
    console.error(`Failed to send notification for Applicant ${applicantId}:`, notificationError);
  }
}
