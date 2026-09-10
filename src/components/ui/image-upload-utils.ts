export const DEFAULT_IMAGE_UPLOAD_MAX_SIZE = 500 * 1024 * 1024;
export const DEFAULT_IMAGE_UPLOAD_ACCEPT = 'image/*';

export type ImageUploadPreviewSize = 'sm' | 'md' | 'lg';

export const IMAGE_UPLOAD_PREVIEW_SIZE_CLASSES: Record<ImageUploadPreviewSize, string> = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function validateImageUploadFile(file: File, maxSize: number) {
  if (!file.type.startsWith('image/')) {
    return {
      ok: false as const,
      message: 'Please select a valid image file',
    };
  }

  if (file.size > maxSize) {
    return {
      ok: false as const,
      message: `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
    };
  }

  return { ok: true as const };
}

export function getImageUploadPreviewSizeClass(size: ImageUploadPreviewSize) {
  return IMAGE_UPLOAD_PREVIEW_SIZE_CLASSES[size];
}
