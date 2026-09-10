import { describe, expect, it } from 'vitest';
import {
  getUserAvatarGradient,
  getUserAvatarUploadInitials,
  hasPersistentUserAvatarImage,
  USER_AVATAR_UPLOAD_FONT_SIZE_CLASSES,
  USER_AVATAR_UPLOAD_SIZE_CLASSES,
} from './user-avatar-upload-utils';

describe('user-avatar-upload-utils', () => {
  it('defines stable size and font classes', () => {
    expect(USER_AVATAR_UPLOAD_SIZE_CLASSES.lg).toBe('w-20 h-20');
    expect(USER_AVATAR_UPLOAD_FONT_SIZE_CLASSES.xl).toBe('text-3xl');
  });

  it('derives initials and persistent image state', () => {
    expect(getUserAvatarUploadInitials({ id: '1', name: 'ada', email: 'ada@example.com' })).toBe('A');
    expect(getUserAvatarUploadInitials({ id: '1', name: '', email: 'grace@example.com' })).toBe('G');
    expect(getUserAvatarUploadInitials({ id: '1', name: '', email: '' })).toBe('?');
    expect(hasPersistentUserAvatarImage({ id: '1', name: 'Ada', avatarUrl: '/avatar.png' })).toBe(true);
    expect(hasPersistentUserAvatarImage({ id: '1', name: 'Ada' })).toBe(false);
  });

  it('keeps each user fallback gradient stable', () => {
    const user = { id: 'employee-42', name: 'Ada' };
    expect(getUserAvatarGradient(user)).toBe(getUserAvatarGradient(user));
    expect(getUserAvatarGradient(user)).toContain('radial-gradient');
  });
});
