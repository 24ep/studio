import type { ColorValue } from './enhanced-color-picker-types';

export type MediaMode = 'image' | 'video';

export function getMediaValue(colorValue: ColorValue, mode: MediaMode) {
  return mode === 'image' ? colorValue.image : colorValue.video;
}

export function getMediaAccept(mode: MediaMode) {
  return mode === 'image' ? 'image/*' : 'video/*';
}

export function getMediaUploadLabel(mode: MediaMode) {
  return mode === 'image' ? 'Image' : 'Video';
}

export function getMediaActionLabel(action: 'Upload' | 'Remove', mode: MediaMode) {
  return `${action} ${getMediaUploadLabel(mode)}`;
}

export function removeMediaValue(colorValue: ColorValue, mode: MediaMode): ColorValue {
  return mode === 'image'
    ? { ...colorValue, mode: 'image', image: '' }
    : { ...colorValue, mode: 'video', video: '' };
}

export function parseMediaValue(value: string): ColorValue | null {
  if (!(value.startsWith('http') || value.startsWith('/') || value.startsWith('data:'))) {
    return null;
  }

  if (value.match(/\.(mp4|webm|ogg)$/i)) {
    return { mode: 'video', video: value };
  }

  if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || value.startsWith('data:image')) {
    return { mode: 'image', image: value };
  }

  return null;
}
