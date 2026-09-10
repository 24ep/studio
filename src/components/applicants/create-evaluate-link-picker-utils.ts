import type {
  AzureMeetingRoom,
  Interviewer,
  User,
} from './create-evaluate-link-types';

export function getAvailableUsersForInterviewers(users: User[], interviewers: Interviewer[]): User[] {
  const assignedUserIds = new Set(interviewers.map((interviewer) => interviewer.userId));
  return users.filter((user) => !assignedUserIds.has(user.id));
}

export function filterUsersBySearchQuery(users: User[], query: string): User[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return users;
  }

  return users.filter((user) =>
    user.name.toLowerCase().includes(normalizedQuery) ||
    user.email.toLowerCase().includes(normalizedQuery)
  );
}

export function filterAzureMeetingRooms(
  rooms: AzureMeetingRoom[],
  query: string,
  limit = 10
): AzureMeetingRoom[] {
  const normalizedQuery = query.trim().toLowerCase();

  return rooms
    .filter((room) =>
      !normalizedQuery ||
      room.displayName.toLowerCase().includes(normalizedQuery) ||
      Boolean(room.building?.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, limit);
}

export function hasMatchingAzureMeetingRoom(rooms: AzureMeetingRoom[], query: string): boolean {
  return filterAzureMeetingRooms(rooms, query, Number.MAX_SAFE_INTEGER).length > 0;
}

export function toggleStringSet(values: Set<string>, value: string, checked?: boolean): Set<string> {
  const nextValues = new Set(values);
  const shouldAdd = checked ?? !nextValues.has(value);

  if (shouldAdd) {
    nextValues.add(value);
  } else {
    nextValues.delete(value);
  }

  return nextValues;
}
