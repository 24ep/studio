export interface GroupMemberUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

export function getGroupMemberInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatGroupMemberJoinedDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export function normalizeAvailableGroupUsersResponse(data: unknown): GroupMemberUser[] {
  if (Array.isArray(data)) {
    return data as GroupMemberUser[];
  }

  if (data && typeof data === 'object' && Array.isArray((data as { users?: unknown }).users)) {
    return (data as { users: GroupMemberUser[] }).users;
  }

  return [];
}

export function buildAvailableGroupUsersUrl(origin: string, searchTerm: string) {
  const url = new URL('/api/users', origin);
  if (searchTerm) {
    url.searchParams.set('search', searchTerm);
  }

  return url.toString();
}

export function getGroupMembersErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
