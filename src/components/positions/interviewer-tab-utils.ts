import { format } from 'date-fns';
import type { Interviewer, InterviewerUser } from './interviewer-tab-types';

export function isBlankEntityId(value: string | null | undefined) {
  return !value || value === 'null' || value === 'undefined';
}

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function getFilteredAvailableUsers({
  users,
  interviewers,
  searchTerm,
}: {
  users: InterviewerUser[];
  interviewers: Interviewer[];
  searchTerm: string;
}) {
  const assignedUserIds = new Set(interviewers.map((interviewer) => interviewer.userId));
  const normalizedSearch = searchTerm.toLowerCase();

  return users.filter((user) => (
    !assignedUserIds.has(user.id) &&
    (user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch))
  ));
}

export function getSelectedUsers(users: InterviewerUser[], selectedUserIds: Set<string>) {
  return users.filter((user) => selectedUserIds.has(user.id));
}

export function getFilteredInterviewers(interviewers: Interviewer[], searchTerm: string) {
  const normalizedSearch = searchTerm.toLowerCase();

  return interviewers.filter((interviewer) => (
    interviewer.userName.toLowerCase().includes(normalizedSearch) ||
    interviewer.userEmail.toLowerCase().includes(normalizedSearch)
  ));
}

export function getMobileSelectedInterviewersLabel(selectedCount: number) {
  if (selectedCount === 0) {
    return 'Select interviewers...';
  }

  return `${selectedCount} interviewer${selectedCount > 1 ? 's' : ''} selected`;
}

export function getAddInterviewersButtonLabel(selectedCount: number) {
  return `Add ${selectedCount} Interviewer${selectedCount > 1 ? 's' : ''}`;
}

export function getAvailableUsersEmptyMessage(searchTerm: string) {
  return searchTerm ? 'No users match your search.' : 'No available users.';
}

export function getInterviewerEmptyStateCopy(searchTerm: string) {
  return {
    title: 'No Interviewers Assigned',
    description: searchTerm
      ? 'No interviewers match your search.'
      : 'No users have been assigned as interviewers for this position yet.',
    showAddButton: !searchTerm,
  };
}

export function getInterviewersSummaryLabel({
  filteredCount,
  totalCount,
  isFiltered,
}: {
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
}) {
  return `${filteredCount} of ${totalCount} interviewer${totalCount !== 1 ? 's' : ''}${isFiltered ? ' (filtered)' : ''}`;
}

export function formatInterviewerAddedDate(createdAt: string | number | Date) {
  return format(new Date(createdAt), 'MMM d, yyyy');
}
