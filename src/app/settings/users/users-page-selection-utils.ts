import type { UserProfile } from '@/lib/types';

import type { UsersPageSelectionState } from './users-page-types';

type UserIdRow = Pick<UserProfile, 'id'>;

function getSelectionMode(selectedUserIds: Set<string>): UsersPageSelectionState['selectionMode'] {
  return selectedUserIds.size > 0 ? 'page' : 'none';
}

function setUserSelected(selectedUserIds: Set<string>, userId: string, checked: boolean) {
  if (checked) {
    selectedUserIds.add(userId);
    return;
  }

  selectedUserIds.delete(userId);
}

export function selectUsersOnPage(
  currentSelection: Set<string>,
  users: UserIdRow[],
  checked: boolean
): UsersPageSelectionState {
  const nextSelection = new Set(currentSelection);
  users.forEach(user => setUserSelected(nextSelection, user.id, checked));

  return {
    selectedUserIds: nextSelection,
    selectionMode: checked || nextSelection.size > 0 ? 'page' : 'none',
  };
}

export function toggleUserSelection(
  currentSelection: Set<string>,
  userId: string,
  checked: boolean
): UsersPageSelectionState {
  const nextSelection = new Set(currentSelection);
  setUserSelected(nextSelection, userId, checked);

  return {
    selectedUserIds: nextSelection,
    selectionMode: getSelectionMode(nextSelection),
  };
}

export function getUsersPageSelectionSummary(
  users: UserIdRow[],
  selectedUserIds: Set<string>
) {
  const selectedUsersOnPage = users.filter(user => selectedUserIds.has(user.id));
  const isAllSelectedOnPage = users.length > 0 && selectedUsersOnPage.length === users.length;

  return {
    isAllSelectedOnPage,
    isSomeSelectedOnPage: selectedUsersOnPage.length > 0 && !isAllSelectedOnPage,
  };
}

export function updateUserInUsersList(
  users: UserProfile[],
  userId: string,
  updatedUser: Partial<UserProfile>
) {
  return users.map((user) =>
    user.id === userId ? { ...user, ...updatedUser } : user
  );
}

export function updateUserStatusInUsersList(
  users: UserProfile[],
  userId: string,
  isActive: boolean
) {
  return updateUserInUsersList(users, userId, { isActive });
}
