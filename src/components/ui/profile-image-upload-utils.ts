export const PROFILE_IMAGE_MAX_SIZE_BYTES = 500 * 1024 * 1024;

export interface ProfileImageUploadUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  image?: string | null;
  email?: string;
}

export interface ProfileImageUploadValidationResult {
  ok: boolean;
  message?: string;
}

export function validateProfileImageFile(file: File): ProfileImageUploadValidationResult {
  if (!file.type.startsWith('image/')) {
    return {
      ok: false,
      message: 'Please select a valid image file',
    };
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return {
      ok: false,
      message: 'Image size must be less than 500MB',
    };
  }

  return { ok: true };
}

export function hasProfileImage({
  displayImageUrl,
  user,
}: {
  displayImageUrl: string | null;
  user: ProfileImageUploadUser;
}) {
  return Boolean(displayImageUrl || user.avatarUrl || user.image);
}

export function getUploadedImageUrl(value: unknown): string | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'file' in value &&
    typeof value.file === 'object' &&
    value.file !== null &&
    'url' in value.file &&
    typeof value.file.url === 'string'
  ) {
    return value.file.url;
  }

  return null;
}
