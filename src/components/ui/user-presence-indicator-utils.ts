import type { UserPresence } from '@/hooks/use-user-presence';

export function getOnlinePresenceUsers(users?: UserPresence[] | null) {
  return (users || []).filter(user => user.isOnline);
}

export function getVisiblePresenceUsers(users: UserPresence[] | null | undefined, maxVisible: number) {
  return getOnlinePresenceUsers(users).slice(0, maxVisible);
}

export function getRemainingPresenceCount(users: UserPresence[] | null | undefined, maxVisible: number) {
  return Math.max(0, getOnlinePresenceUsers(users).length - maxVisible);
}

export function buildPresenceUsersKey(users: UserPresence[]) {
  return users.map(user => `${user.userId}-${user.isOnline}`).join(',');
}

export function getPresenceUserInitials(userName: string) {
  return userName
    .split(' ')
    .filter(Boolean)
    .map(namePart => namePart[0])
    .join('')
    .toUpperCase();
}
