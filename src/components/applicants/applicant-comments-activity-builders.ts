import {
  compareCombinedActivityDateDescending,
  getCombinedApplicantActivityDate,
} from './applicant-comments-activity-date-utils';
import {
  getApplicantActivityAuthorName,
  getApplicantCommentAttachments,
} from './applicant-comments-activity-display-utils';
import {
  isNonCommentActivityLog,
  normalizeApplicantCommentActivity,
  normalizeApplicantLogActivity,
  normalizeApplicantReminderActivity,
} from './applicant-comments-activity-normalizers';
import type {
  ApplicantActivityLogItem,
  ApplicantCommentItem,
  ApplicantReminderItem,
  CombinedActivityItem,
} from './applicant-comments-types';

export {
  getApplicantActivityAuthorName,
  getApplicantCommentAttachments,
  getCombinedApplicantActivityDate,
};

function toArray<T>(value?: T[] | null) {
  return Array.isArray(value) ? value : [];
}

export function buildCombinedApplicantActivities({
  comments,
  logs,
  reminders,
}: {
  comments?: ApplicantCommentItem[] | null;
  logs?: ApplicantActivityLogItem[] | null;
  reminders?: ApplicantReminderItem[] | null;
}): CombinedActivityItem[] {
  return [
    ...toArray(comments).map(normalizeApplicantCommentActivity),
    ...toArray(logs)
      .filter(isNonCommentActivityLog)
      .map(normalizeApplicantLogActivity),
    ...toArray(reminders).map(normalizeApplicantReminderActivity),
  ].sort(compareCombinedActivityDateDescending);
}
