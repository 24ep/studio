import { describe, expect, it } from 'vitest';

import {
  BULK_CV_MAX_FILE_SIZE,
  appendBulkCvFilesWithBatchIds,
  buildBulkUploadViewerFile,
  getBulkUploadErrorToast,
  getBulkUploadFileBatchLabel,
  getBulkUploadFileListItemClassName,
  getBulkUploadLayoutClasses,
  getBulkUploadProgressBarWidth,
  getBulkUploadProgressCountLabel,
  getBulkUploadProgressLabel,
  getBulkUploadProgressPercent,
  getBulkUploadSelectedFileIndex,
  getBulkUploadSelectedFilesLabel,
  getBulkUploadSourceAllowsSubSource,
  getBulkUploadSubmitButtonText,
  getBulkUploadSuccessToast,
  getInitialBulkUploadModalFormState,
  isBulkUploadSubmitDisabled,
  resolveBulkUploadPositionSelection,
  shouldShowBulkUploadFileList,
  shouldShowBulkUploadProgress,
  summarizeBulkUploadResponse,
  validateBulkCvFiles,
} from './bulk-upload-cvs-utils';

function file(name: string, type = 'application/pdf', size = 100) {
  return new File(['x'.repeat(size)], name, { type });
}

describe('bulk upload CV utilities', () => {
  it('validates resume document and image files with max size limits', () => {
    const validPdf = file('resume.pdf');
    const validDocx = file('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const validImage = file('resume.png', 'image/png');
    const invalidType = file('resume.txt', 'text/plain');
    const tooLarge = file('big.pdf', 'application/pdf', 6 * 1024 * 1024);

    expect(validateBulkCvFiles([validPdf, validDocx, validImage, invalidType, tooLarge], 5 * 1024 * 1024)).toEqual({
      validFiles: [validPdf, validDocx, validImage],
      errors: [
        'resume.txt: Invalid file type (PDF, Word, or image only)',
        'big.pdf: File too large (max 5MB)',
      ],
    });
    expect(BULK_CV_MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
  });

  it('appends files while preserving existing batch IDs', () => {
    const existing = file('existing.pdf');
    const duplicate = file('existing.pdf');
    const added = file('added.pdf');
    let id = 1;

    const result = appendBulkCvFilesWithBatchIds({
      existingFiles: [existing],
      existingBatchMap: { 'existing.pdf': 'batch-existing' },
      newFiles: [duplicate, added],
      createBatchId: () => `batch-${id++}`,
    });

    expect(result.files).toEqual([existing, duplicate, added]);
    expect(result.batchMap).toEqual({
      'existing.pdf': 'batch-existing',
      'added.pdf': 'batch-1',
    });
  });

  it('resolves single position selection from arbitrary selected sets', () => {
    const selection = resolveBulkUploadPositionSelection(new Set(['position-1', 'position-2']));

    expect(selection.selectedPositionId).toBe('position-1');
    expect(Array.from(selection.selectedPositionIds)).toEqual(['position-1']);
    expect(resolveBulkUploadPositionSelection(new Set()).selectedPositionId).toBe('');
  });

  it('builds modal display state helpers defensively', () => {
    expect(getInitialBulkUploadModalFormState()).toMatchObject({
      selectedFiles: [],
      selectedPositionId: '',
      selectedSourceId: '',
      subSource: '',
      selectedFileIndex: 0,
      uploadProgress: null,
      uploading: false,
    });
    expect(Array.from(getInitialBulkUploadModalFormState().selectedPositionIds)).toEqual([]);

    expect(getBulkUploadSelectedFileIndex(4, 2)).toBe(1);
    expect(getBulkUploadSelectedFileIndex(0, 0)).toBe(0);
    expect(getBulkUploadProgressPercent({ current: 2, total: 4 })).toBe(50);
    expect(getBulkUploadProgressPercent({ current: 2, total: 0 })).toBe(0);
    expect(getBulkUploadProgressPercent(null)).toBe(0);
    expect(getBulkUploadProgressBarWidth({ current: 1, total: 4 })).toBe('25%');
    expect(getBulkUploadProgressBarWidth(null)).toBe('0%');
  });

  it('derives modal layout and selected-file display helpers', () => {
    expect(shouldShowBulkUploadFileList(0)).toBe(false);
    expect(shouldShowBulkUploadFileList(1)).toBe(true);
    expect(getBulkUploadLayoutClasses(0)).toEqual({
      gridClassName: 'grid gap-6 grid-cols-1',
      uploadAreaClassName: 'col-span-1',
    });
    expect(getBulkUploadLayoutClasses(2)).toEqual({
      gridClassName: 'grid overflow-hidden rounded-lg border bg-background lg:grid-cols-[minmax(0,1fr)_340px]',
      uploadAreaClassName: 'p-4',
    });
    expect(getBulkUploadSelectedFilesLabel(3)).toBe('Selected Files (3)');
    expect(getBulkUploadFileListItemClassName(true)).toContain('border-primary bg-primary/5');
    expect(getBulkUploadFileListItemClassName(false)).toContain('border-border hover:border-primary/50');
    expect(getBulkUploadFileBatchLabel('batch-1')).toBe('ID: batch-1');
    expect(getBulkUploadFileBatchLabel()).toBe('ID: ');
  });

  it('derives upload progress and submit button state', () => {
    expect(shouldShowBulkUploadProgress(false)).toBe(false);
    expect(shouldShowBulkUploadProgress(true)).toBe(true);
    expect(getBulkUploadProgressLabel(4)).toBe('Uploading 4 files...');
    expect(getBulkUploadProgressCountLabel({ current: 2, total: 4 })).toBe('(2/4)');
    expect(getBulkUploadProgressCountLabel(null)).toBeNull();
    expect(getBulkUploadSubmitButtonText(false, 3)).toBe('Upload 3 files');
    expect(getBulkUploadSubmitButtonText(true, 3)).toBe('Uploading...');
    expect(isBulkUploadSubmitDisabled(0, false)).toBe(true);
    expect(isBulkUploadSubmitDisabled(1, true)).toBe(true);
    expect(isBulkUploadSubmitDisabled(1, false)).toBe(false);
  });

  it('derives source and file viewer metadata for the modal', () => {
    expect(getBulkUploadSourceAllowsSubSource([
      { id: 'source-1', allowSubSource: true },
      { id: 'source-2', allowSubSource: false },
    ], 'source-1')).toBe(true);
    expect(getBulkUploadSourceAllowsSubSource([{ id: 'source-2', allowSubSource: false }], 'source-2')).toBe(false);
    expect(getBulkUploadSourceAllowsSubSource([{ id: 'source-1', allowSubSource: true }], '')).toBe(false);

    const resume = file('resume.pdf', 'application/pdf', 123);
    expect(buildBulkUploadViewerFile(resume, 'blob:resume')).toEqual({
      fileName: 'resume.pdf',
      url: 'blob:resume',
      label: undefined,
      updatedAt: undefined,
      fileSize: 123,
    });
  });

  it('summarizes upload responses and user-facing toast messages', () => {
    const summary = summarizeBulkUploadResponse({
      summary: { success: 2, failed: 1 },
      results: [
        { status: 'success', file_name: 'a.pdf' },
        { status: 'failed', file_name: 'b.pdf', error: 'Bad file' },
      ],
    });

    expect(summary).toMatchObject({
      success: true,
      successful: 2,
      failed: 1,
      errors: ['b.pdf: Bad file'],
    });
    expect(getBulkUploadSuccessToast(summary)).toEqual({
      title: 'Upload Complete: 2 files uploaded, 1 files failed',
      description: 'Failed files: b.pdf: Bad file',
    });
    expect(getBulkUploadSuccessToast({ successful: 2, failed: 0, errors: [] })).toEqual({
      title: 'Upload Complete: 2 files uploaded and queued for processing',
    });
    expect(getBulkUploadSuccessToast({
      successful: 2,
      failed: 0,
      errors: [],
      queuedAfterTimeout: true,
    })).toEqual({
      title: 'Upload queued: 2 files accepted for processing',
      description: 'The server is still processing the upload response. You can follow progress in Process Queue.',
    });
  });

  it('summarizes malformed upload responses defensively', () => {
    expect(summarizeBulkUploadResponse({
      summary: { success: '2', failed: Number.NaN },
      results: [
        { status: 'failed' },
        null,
        { status: 'failed', file_name: 'broken.pdf' },
      ],
    })).toMatchObject({
      success: true,
      successful: 0,
      failed: 0,
      errors: [
        'Unknown file: Unknown error',
        'broken.pdf: Unknown error',
      ],
    });

    expect(summarizeBulkUploadResponse(null)).toMatchObject({
      successful: 0,
      failed: 0,
      errors: [],
    });
  });

  it('maps upload errors to actionable toast messages', () => {
    expect(getBulkUploadErrorToast(new Error('Upload timed out.'))).toMatchObject({ title: 'Upload timed out' });
    expect(getBulkUploadErrorToast(new Error('Network error.'))).toMatchObject({ title: 'Network error' });
    expect(getBulkUploadErrorToast(new Error('Forbidden'))).toMatchObject({ title: 'Permission denied' });
    expect(getBulkUploadErrorToast(new Error('Unauthorized'))).toMatchObject({ title: 'Session expired' });
    expect(getBulkUploadErrorToast(new Error('Custom failure'))).toEqual({
      title: 'Upload failed',
      description: 'Custom failure',
    });
  });
});
