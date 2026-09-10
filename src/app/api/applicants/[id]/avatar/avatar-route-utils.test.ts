import { describe, expect, it, vi } from 'vitest';

import {
  buildAvatarObjectName,
  buildAvatarPreviewUrl,
  MAX_AVATAR_SIZE_BYTES,
  validateAvatarUploadFile,
} from './avatar-route-utils';

describe('avatar route utilities', () => {
  it('validates avatar upload files', () => {
    expect(validateAvatarUploadFile(null)).toEqual({ ok: false, message: 'No file uploaded' });
    expect(validateAvatarUploadFile('not-a-file')).toEqual({ ok: false, message: 'No file uploaded' });
    expect(validateAvatarUploadFile(new File(['x'], 'cv.pdf', { type: 'application/pdf' }))).toEqual({
      ok: false,
      message: 'Invalid file type. Only image files are allowed.',
    });

    const image = new File(['x'], 'avatar.png', { type: 'image/png' });
    expect(validateAvatarUploadFile(image)).toEqual({ ok: true, file: image });
  });

  it('rejects avatar files over the configured limit', () => {
    const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: MAX_AVATAR_SIZE_BYTES + 1 });

    expect(validateAvatarUploadFile(file)).toEqual({
      ok: false,
      message: 'File too large. Maximum size is 500MB.',
    });
  });

  it('builds stable object names and preview URLs', () => {
    const idFactory = vi.fn(() => 'generated-id');
    expect(buildAvatarObjectName('applicant-id', 'Avatar.PNG', idFactory)).toBe('avatars/applicant-id/generated-id.png');
    expect(buildAvatarObjectName('applicant-id', 'avatar', idFactory)).toBe('avatars/applicant-id/generated-id.avatar');

    vi.stubEnv('NEXTAUTH_URL', 'https://app.example.com');
    expect(buildAvatarPreviewUrl('avatars/applicant/id.png')).toBe(
      'https://app.example.com/api/secure-file/preview?filePath=avatars%2Fapplicant%2Fid.png',
    );
    vi.unstubAllEnvs();
  });
});
