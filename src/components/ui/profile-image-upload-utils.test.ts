import { describe, expect, it } from 'vitest';

import {
  getUploadedImageUrl,
  hasProfileImage,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  validateProfileImageFile,
} from './profile-image-upload-utils';

const makeFile = ({ size, type }: { size: number; type: string }) => {
  const file = new File(['avatar'], 'avatar.png', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('profile image upload utilities', () => {
  it('validates image file type and size', () => {
    expect(validateProfileImageFile(makeFile({ size: 100, type: 'image/png' }))).toEqual({ ok: true });
    expect(validateProfileImageFile(makeFile({ size: 100, type: 'text/plain' }))).toEqual({
      ok: false,
      message: 'Please select a valid image file',
    });
    expect(validateProfileImageFile(makeFile({
      size: PROFILE_IMAGE_MAX_SIZE_BYTES + 1,
      type: 'image/png',
    }))).toEqual({
      ok: false,
      message: 'Image size must be less than 500MB',
    });
  });

  it('detects profile images from preview or persisted urls', () => {
    expect(hasProfileImage({
      displayImageUrl: null,
      user: { id: 'user-1', name: 'Ada' },
    })).toBe(false);
    expect(hasProfileImage({
      displayImageUrl: 'blob:avatar',
      user: { id: 'user-1', name: 'Ada' },
    })).toBe(true);
    expect(hasProfileImage({
      displayImageUrl: null,
      user: { id: 'user-1', name: 'Ada', image: 'image-url' },
    })).toBe(true);
  });

  it('normalizes upload response image url', () => {
    expect(getUploadedImageUrl({ file: { url: '/avatar.png' } })).toBe('/avatar.png');
    expect(getUploadedImageUrl({ file: { url: null } })).toBeNull();
    expect(getUploadedImageUrl(null)).toBeNull();
  });
});
