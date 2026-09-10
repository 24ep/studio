import { describe, expect, it } from 'vitest';
import {
  DEFAULT_IMAGE_UPLOAD_MAX_SIZE,
  getImageUploadPreviewSizeClass,
  validateImageUploadFile,
} from './image-upload-utils';

function makeFile({ size, type }: { size: number; type: string }) {
  return { size, type } as File;
}

describe('image-upload-utils', () => {
  it('validates image type and size', () => {
    expect(validateImageUploadFile(makeFile({ size: 1024, type: 'image/png' }), DEFAULT_IMAGE_UPLOAD_MAX_SIZE)).toEqual({ ok: true });
    expect(validateImageUploadFile(makeFile({ size: 1024, type: 'text/plain' }), DEFAULT_IMAGE_UPLOAD_MAX_SIZE)).toEqual({
      ok: false,
      message: 'Please select a valid image file',
    });
    expect(validateImageUploadFile(makeFile({ size: 2, type: 'image/png' }), 1)).toEqual({
      ok: false,
      message: 'File size must be less than 0.0MB',
    });
  });

  it('returns preview size classes', () => {
    expect(getImageUploadPreviewSizeClass('sm')).toBe('h-16 w-16');
    expect(getImageUploadPreviewSizeClass('md')).toBe('h-24 w-24');
    expect(getImageUploadPreviewSizeClass('lg')).toBe('h-32 w-32');
  });
});
