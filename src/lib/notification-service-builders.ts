import type { NotificationData } from './notification-service-types';

export function buildRecruiterAssignedNotification({
  positionId,
  positionTitle,
  assignedByUserId,
}: {
  positionId: string;
  positionTitle: string;
  assignedByUserId: string;
}): NotificationData {
  return {
    type: 'recruiter_assigned',
    title: 'Position Assignment',
    message: `You have been assigned as the recruiter for the position "${positionTitle}"`,
    data: {
      positionId,
      positionTitle,
      assignedBy: assignedByUserId,
    },
  };
}

export function buildApplicantAddedNotification({
  applicantId,
  applicantName,
  positionId,
  positionTitle,
  addedByUserId,
}: {
  applicantId: string;
  applicantName: string;
  positionId: string;
  positionTitle: string;
  addedByUserId: string;
}): NotificationData {
  return {
    type: 'Applicant_added',
    title: 'New Applicant Added',
    message: `A new applicant "${applicantName}" has been added to position "${positionTitle}"`,
    data: {
      applicantId,
      applicantName,
      positionId,
      positionTitle,
      addedBy: addedByUserId,
    },
  };
}

export function buildApplicantStatusChangeNotification({
  applicantId,
  applicantName,
  oldStatus,
  newStatus,
  positionId,
  positionTitle,
  changedByUserId,
}: {
  applicantId: string;
  applicantName: string;
  oldStatus: string;
  newStatus: string;
  positionId: string;
  positionTitle: string;
  changedByUserId: string;
}): NotificationData {
  return {
    type: 'Applicant_status_change',
    title: 'Applicant Status Updated',
    message: `Applicant "${applicantName}" status changed from "${oldStatus}" to "${newStatus}" for position "${positionTitle}"`,
    data: {
      applicantId,
      applicantName,
      oldStatus,
      newStatus,
      positionId,
      positionTitle,
      changedBy: changedByUserId,
    },
  };
}
