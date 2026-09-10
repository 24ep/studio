import { describe, expect, it } from 'vitest';

import {
  createUploadFileEntries,
  getUploadStatusBadgeVariant,
  getUploadingFilesCount,
  markMatchingUploadFilesStatus,
  removeCompletedUploadFiles,
  updateUploadFileProgress,
  validateDragDropUploadFile,
} from './drag-drop-upload-utils';

function makeFile(name: string, size = 1024) {
  return new File(['x'.repeat(size)], name, { type: 'text/plain' });
}

describe('drag drop upload utils', () => {
  it('validates file sizes', () => {
    expect(validateDragDropUploadFile(makeFile('small.txt', 100), 1024)).toBeNull();
    expect(validateDragDropUploadFile(makeFile('large.txt', 2048), 1024)).toBe('File size exceeds 0MB limit');
  });

  it('creates and updates upload entries', () => {
    const [entry] = createUploadFileEntries([makeFile('a.txt')], () => 'id-1');

    expect(entry).toMatchObject({ id: 'id-1', progress: 0, status: 'pending' });
    expect(updateUploadFileProgress([entry], 'id-1', 50)[0]).toMatchObject({
      progress: 50,
      status: 'uploading',
    });
    expect(updateUploadFileProgress([entry], 'id-1', 100)[0]).toMatchObject({
      progress: 100,
      status: 'completed',
    });
  });

  it('marks matching files and removes completed entries', () => {
    const fileA = makeFile('a.txt');
    const fileB = makeFile('b.txt');
    const entries = createUploadFileEntries([fileA, fileB], () => Math.random().toString());
    const marked = markMatchingUploadFilesStatus(entries, [fileA], 'error', 'Upload failed');

    expect(marked[0]).toMatchObject({ status: 'error', error: 'Upload failed' });
    expect(marked[1]).toMatchObject({ status: 'pending' });
    expect(removeCompletedUploadFiles([
      { ...marked[0], status: 'completed' },
      marked[1],
    ])).toEqual([marked[1]]);
  });

  it('counts uploading files and maps badge variants', () => {
    expect(getUploadingFilesCount([
      { id: '1', file: makeFile('a.txt'), progress: 50, status: 'uploading' },
      { id: '2', file: makeFile('b.txt'), progress: 0, status: 'pending' },
    ])).toBe(1);
    expect(getUploadStatusBadgeVariant('pending')).toBe('secondary');
    expect(getUploadStatusBadgeVariant('uploading')).toBe('default');
    expect(getUploadStatusBadgeVariant('error')).toBe('destructive');
  });
});
