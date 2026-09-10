import { normalizeCommentAttachments } from './applicant-comment-attachment-utils';
import type {
  ApplicantActivityLogItem,
  ApplicantCommentItem,
  ApplicantReminderItem,
  CombinedActivityItem,
} from './applicant-comments-types';

function getNormalizedApplicantCommentType(type?: string | null) {
  return (type || 'comment') === 'activity' ? 'activity' : 'comment';
}

export function normalizeApplicantCommentActivity(comment: ApplicantCommentItem): CombinedActivityItem {
  return {
    id: `comment-${comment.id || 'unknown'}`,
    type: getNormalizedApplicantCommentType(comment.type),
    rawType: comment.type || 'comment',
    content: comment.content || '',
    author: comment.author || 'Unknown',
    createdAt: comment.createdAt || '',
    attachments: normalizeCommentAttachments(comment.attachments),
  };
}

export function normalizeApplicantLogActivity(log: ApplicantActivityLogItem): CombinedActivityItem {
  return {
    id: `activity-${log.id || 'unknown'}`,
    type: 'activity',
    rawType: 'activity',
    action: log.action || '',
    user: log.user || 'System',
    note: log.note || '',
    time: log.time || '',
    attachments: normalizeCommentAttachments(log.attachments),
  };
}

export function normalizeApplicantReminderActivity(reminder: ApplicantReminderItem): CombinedActivityItem {
  return {
    id: `reminder-${reminder.id || 'unknown'}`,
    type: 'activity',
    rawType: 'reminder',
    action: `Reminder: ${reminder.title || ''}`,
    user: reminder.user?.name || 'System',
    note: reminder.content || '',
    time: reminder.reminderDate || '',
  };
}

export function isNonCommentActivityLog(log: ApplicantActivityLogItem) {
  return !log.action || !log.action.toLowerCase().includes('comment');
}
