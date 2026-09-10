import type { Interviewer, User } from './send-interview-invitation-api';

export function getInterviewInvitationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getFilteredAvailableInterviewUsers(availableUsers: User[], interviewers: Interviewer[]) {
  const interviewerUserIds = new Set(interviewers.map((interviewer) => interviewer.userId));
  return availableUsers.filter((user) => !interviewerUserIds.has(user.id));
}

export function toggleIdSelection(currentIds: Set<string>, id: string) {
  const nextIds = new Set(currentIds);
  if (nextIds.has(id)) {
    nextIds.delete(id);
  } else {
    nextIds.add(id);
  }
  return nextIds;
}

export function setCheckedIdSelection(currentIds: Set<string>, id: string, checked: boolean) {
  const nextIds = new Set(currentIds);

  if (checked) {
    nextIds.add(id);
  } else {
    nextIds.delete(id);
  }

  return nextIds;
}

export function getInterviewerSelectionSummary(selectedCount: number, totalCount: number) {
  return `${selectedCount} of ${totalCount} interviewer(s) selected`;
}

export function getAddInterviewersButtonLabel(selectedCount: number) {
  return `Add ${selectedCount} Interviewer${selectedCount > 1 ? 's' : ''}`;
}

export function getPersonPositionSuffix(positionTitle?: string | null) {
  return positionTitle ? ` - ${positionTitle}` : '';
}

export function getInterviewInvitationResultMessage(resultCounts: {
  errorCount: number;
  successCount: number;
}) {
  const { errorCount, successCount } = resultCounts;
  return errorCount > 0
    ? `Sent ${successCount} invitation(s), ${errorCount} failed`
    : `Successfully sent ${successCount} invitation(s)`;
}
