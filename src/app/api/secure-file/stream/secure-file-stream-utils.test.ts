import { describe, expect, it } from 'vitest';
import {
  getStreamFileName,
  inferStreamContentType,
  setNoStoreHeaders,
} from './secure-file-stream-headers';
import { isStreamImage, parseStreamRangeHeader } from './secure-file-stream-request';

describe('secure-file-stream utilities', () => {
  it('infers content types from file extensions', () => {
    expect(inferStreamContentType('resume.PDF')).toBe('application/pdf');
    expect(inferStreamContentType('photo.jpeg')).toBe('image/jpeg');
    expect(inferStreamContentType('logo.svg')).toBe('image/svg+xml');
    expect(inferStreamContentType('archive.bin')).toBe('application/octet-stream');
  });

  it('parses byte ranges and falls back for invalid ranges', () => {
    expect(parseStreamRangeHeader('bytes=10-19', 100)).toEqual({ start: 10, end: 19, chunkSize: 10 });
    expect(parseStreamRangeHeader('bytes=90-', 100)).toEqual({ start: 90, end: 99, chunkSize: 10 });
    expect(parseStreamRangeHeader('items=1-2', 100)).toBeNull();
  });

  it('detects stream images and normalizes filenames', () => {
    expect(isStreamImage('attachments/a/photo.webp')).toBe(true);
    expect(isStreamImage('attachments/a/file.pdf')).toBe(false);
    expect(getStreamFileName(undefined, 'attachments/a/file.pdf')).toBe('file.pdf');
  });

  it('sets no-store headers consistently', () => {
    const headers = new Headers();
    setNoStoreHeaders(headers);

    expect(headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(headers.get('Pragma')).toBe('no-cache');
    expect(headers.get('Expires')).toBe('0');
  });
});
