export type UserAvatarUploadSize = 'sm' | 'md' | 'lg' | 'xl' | 'review';

export interface UserAvatarUploadUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  image?: string | null;
  email?: string;
}

export const USER_AVATAR_UPLOAD_SIZE_CLASSES: Record<UserAvatarUploadSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
  review: 'h-16 w-16',
};

export const USER_AVATAR_UPLOAD_FONT_SIZE_CLASSES: Record<UserAvatarUploadSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  review: 'text-xl',
};

export function getUserAvatarUploadInitials(user: UserAvatarUploadUser) {
  return user.name?.charAt(0)?.toUpperCase()
    || user.email?.charAt(0)?.toUpperCase()
    || '?';
}

const USER_AVATAR_GRADIENTS = [
  'radial-gradient(circle at 25% 20%, oklch(75% 0.18 45), transparent 52%), radial-gradient(circle at 80% 78%, oklch(56% 0.21 12), transparent 58%), oklch(54% 0.18 330)',
  'radial-gradient(circle at 22% 25%, oklch(75% 0.16 185), transparent 50%), radial-gradient(circle at 82% 75%, oklch(54% 0.2 255), transparent 58%), oklch(55% 0.18 225)',
  'radial-gradient(circle at 25% 22%, oklch(78% 0.16 105), transparent 50%), radial-gradient(circle at 78% 80%, oklch(55% 0.2 155), transparent 58%), oklch(55% 0.17 135)',
  'radial-gradient(circle at 20% 25%, oklch(76% 0.16 300), transparent 50%), radial-gradient(circle at 82% 76%, oklch(55% 0.22 270), transparent 58%), oklch(55% 0.2 315)',
] as const;

export function getUserAvatarGradient(user: UserAvatarUploadUser) {
  const seed = user.id || user.email || user.name || '?';
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return USER_AVATAR_GRADIENTS[Math.abs(hash) % USER_AVATAR_GRADIENTS.length];
}

export function hasPersistentUserAvatarImage(user: UserAvatarUploadUser) {
  return Boolean(user.avatarUrl || user.image);
}
