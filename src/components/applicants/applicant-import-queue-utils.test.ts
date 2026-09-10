import { describe, expect, it } from 'vitest';

import type { QueueResponse } from './applicant-import-queue-types';
import {
  UPLOAD_QUEUE_ITEM_STAGGER_DELAY_MS,
  UPLOAD_QUEUE_LOADING_SKELETON_COUNT,
  buildUploadQueueQueryParams,
  calculateUploadQueueDuration,
  canCancelUploadQueueItem,
  canDeleteUploadQueueItem,
  canProcessUploadQueueItem,
  canRetryUploadQueueItem,
  createUploadQueueDatePresetRange,
  createUploadQueuePreviewFile,
  formatUploadQueueFileSize,
  getUploadQueueApplicantProgressText,
  getUploadQueueBulkRetryToastMessages,
  getUploadQueueItemAnimationDelay,
  getUploadQueueItemsDescription,
  getUploadQueueLastUpdatedText,
  getUploadQueuePaginationLabel,
  getUploadQueueProcessedApplicantsText,
  getUploadQueueProgressText,
  getUploadQueueRealtimeStatusText,
  getUploadQueueRefreshIconClassName,
  getUploadQueueRetryErrorMessage,
  getUploadQueueSelectionMode,
  getUploadQueueSourceLine,
  getUploadQueueSummaryToastMessage,
  getUploadQueueStatusBadgeVariant,
  getUploadQueueStatusDisplayText,
  getUploadQueueStatusIconModel,
  getUploadQueueStatusIconType,
  getUploadQueueTotalPages,
  isUploadQueueNextPageDisabled,
  isUploadQueuePreviousPageDisabled,
  markUploadQueueItemQueued,
  removeUploadQueueItem,
  shouldShowUploadQueuePagination,
  toggleUploadQueueSelectAll,
  toggleUploadQueueSelectedItem,
} from './applicant-import-queue-utils';

describe('applicant import queue utilities', () => {
  it('formats file sizes safely', () => {
    expect(formatUploadQueueFileSize(undefined)).toBe('Unknown size');
    expect(formatUploadQueueFileSize(-1)).toBe('Unknown size');
    expect(formatUploadQueueFileSize(0)).toBe('0 Bytes');
    expect(formatUploadQueueFileSize(1536)).toBe('1.5 KB');
  });

  it('calculates processing duration', () => {
    expect(calculateUploadQueueDuration('2024-01-01T00:00:00Z', '2024-01-01T01:05:00Z')).toBe('1h 5m');
    expect(calculateUploadQueueDuration('2024-01-01T00:00:00Z', '2024-01-01T00:02:03Z')).toBe('2m 3s');
    expect(calculateUploadQueueDuration()).toBe('-');
  });

  it('describes statuses and badge variants', () => {
    expect(getUploadQueueStatusDisplayText('queued')).toBe('In Queue');
    expect(getUploadQueueStatusDisplayText('inprocess')).toBe('Processing');
    expect(getUploadQueueStatusBadgeVariant('failed')).toBe('destructive');
    expect(getUploadQueueStatusBadgeVariant('unknown')).toBe('secondary');
    expect(getUploadQueueStatusIconType('queued')).toBe('queued');
    expect(getUploadQueueStatusIconType('inprocess')).toBe('processing');
    expect(getUploadQueueStatusIconType('success')).toBe('success');
    expect(getUploadQueueStatusIconType('fail')).toBe('failed');
    expect(getUploadQueueStatusIconType('unknown')).toBe('unknown');
    expect(getUploadQueueStatusIconModel('queued')).toEqual({
      type: 'queued',
      className: 'h-5 w-5 text-blue-500 dark:text-blue-400',
    });
    expect(getUploadQueueStatusIconModel('inprocess')).toEqual({
      type: 'processing',
      className: 'h-5 w-5 text-yellow-500 dark:text-yellow-400 animate-spin',
    });
    expect(getUploadQueueStatusIconModel('success')).toEqual({
      type: 'success',
      className: 'h-5 w-5 text-green-500 dark:text-green-400',
    });
    expect(getUploadQueueStatusIconModel('failed')).toEqual({
      type: 'failed',
      className: 'h-5 w-5 text-red-500 dark:text-red-400',
    });
    expect(getUploadQueueStatusIconModel('unknown')).toEqual({
      type: 'unknown',
      className: 'h-5 w-5 text-gray-500 dark:text-gray-400',
    });
  });

  it('checks item action eligibility', () => {
    expect(canRetryUploadQueueItem({ status: 'failed' })).toBe(true);
    expect(canCancelUploadQueueItem({ status: 'inprocess' })).toBe(true);
    expect(canDeleteUploadQueueItem({ status: 'cancelled' })).toBe(true);
    expect(canProcessUploadQueueItem({ status: 'queued' })).toBe(true);
    expect(canProcessUploadQueueItem({ status: 'success' })).toBe(false);
  });

  it('builds upload queue query params with typed date filters', () => {
    const params = new URLSearchParams(buildUploadQueueQueryParams({
      currentPage: 3,
      currentPageSize: 25,
      searchTerm: 'resume.pdf',
      statusFilter: 'failed',
      positionFilter: 'position-1',
      sourceFilter: 'source-1',
      dateRange: {
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-02T00:00:00.000Z'),
      },
      dateFilterType: 'process',
      sortField: 'upload_date',
      sortDirection: 'desc',
    }));

    expect(params.get('limit')).toBe('25');
    expect(params.get('offset')).toBe('50');
    expect(params.get('file_name')).toBe('resume.pdf');
    expect(params.get('status')).toBe('failed');
    expect(params.get('position_id')).toBe('position-1');
    expect(params.get('source_id')).toBe('source-1');
    expect(params.get('process_date_start')).toBe('2026-01-01T00:00:00.000Z');
    expect(params.get('process_date_end')).toBe('2026-01-02T00:00:00.000Z');
    expect(params.get('sort_field')).toBe('upload_date');
    expect(params.get('sort_direction')).toBe('desc');
  });

  it('derives queue selection state and toggles selected ids', () => {
    const items = [{ id: '1', status: 'queued' }, { id: '2', status: 'failed' }];

    expect(getUploadQueueSelectionMode(new Set(), items)).toBe('none');
    expect(getUploadQueueSelectionMode(new Set(['1']), items)).toBe('partial');
    expect(getUploadQueueSelectionMode(new Set(['1', '2']), items)).toBe('all');
    expect(Array.from(toggleUploadQueueSelectAll(new Set(), items, 'none'))).toEqual(['1', '2']);
    expect(Array.from(toggleUploadQueueSelectAll(new Set(['1', '2']), items, 'all'))).toEqual([]);
    expect(Array.from(toggleUploadQueueSelectedItem(new Set(['1']), '1'))).toEqual([]);
    expect(Array.from(toggleUploadQueueSelectedItem(new Set(['1']), '2'))).toEqual(['1', '2']);
  });

  it('derives compact queue display text', () => {
    expect(getUploadQueueTotalPages(51, 25)).toBe(3);
    expect(getUploadQueueTotalPages(0, 25)).toBe(0);
    expect(getUploadQueueTotalPages(51, 0)).toBe(0);
    expect(shouldShowUploadQueuePagination(1)).toBe(false);
    expect(shouldShowUploadQueuePagination(2)).toBe(true);
    expect(getUploadQueuePaginationLabel(2, 3)).toBe('Page 2 of 3');
    expect(isUploadQueuePreviousPageDisabled(1)).toBe(true);
    expect(isUploadQueuePreviousPageDisabled(2)).toBe(false);
    expect(isUploadQueueNextPageDisabled(3, 3)).toBe(true);
    expect(isUploadQueueNextPageDisabled(2, 3)).toBe(false);
    expect(getUploadQueueSourceLine({ source_name: 'LinkedIn', sub_source: 'Ads' })).toBe('Source: LinkedIn - Ads');
    expect(getUploadQueueSourceLine({ sub_source: 'Manual' })).toBe('Source: Unknown - Manual');
    expect(getUploadQueueSourceLine({})).toBeNull();
    expect(getUploadQueueProcessedApplicantsText({ processed_applicants: 2, total_applicants: 5 })).toBe(
      'Processed: 2 / 5 Applicants'
    );
    expect(getUploadQueueProcessedApplicantsText({ processed_applicants: 2 })).toBeNull();
    expect(getUploadQueueApplicantProgressText({ processed_applicants: 2, total_applicants: 5 })).toBe(
      '2 of 5 Applicants'
    );
    expect(getUploadQueueApplicantProgressText({ processed_applicants: 2 })).toBeNull();
    expect(getUploadQueueProgressText(65)).toBe('65% complete');
  });

  it('derives queue status header and list presentation helpers', () => {
    const lastUpdate = new Date('2026-06-01T01:02:03.000Z');

    expect(UPLOAD_QUEUE_LOADING_SKELETON_COUNT).toBe(5);
    expect(UPLOAD_QUEUE_ITEM_STAGGER_DELAY_MS).toBe(20);
    expect(getUploadQueueItemsDescription()).toBe('Loading...');
    expect(getUploadQueueItemsDescription(null)).toBe('Loading...');
    expect(getUploadQueueItemsDescription(7)).toBe('7 total items');
    expect(getUploadQueueLastUpdatedText(lastUpdate)).toBe(
      `Last updated: ${lastUpdate.toLocaleString()}`
    );
    expect(getUploadQueueRealtimeStatusText(true)).toBe('Live');
    expect(getUploadQueueRealtimeStatusText(false)).toBe('Offline');
    expect(getUploadQueueRefreshIconClassName(true)).toBe('h-4 w-4 animate-spin');
    expect(getUploadQueueRefreshIconClassName(false)).toBe('h-4 w-4');
    expect(getUploadQueueItemAnimationDelay(3)).toBe(60);
  });

  it('creates date preset ranges', () => {
    const now = new Date('2026-06-15T12:00:00');

    expect(createUploadQueueDatePresetRange('today', now)).toEqual({
      from: new Date(2026, 5, 15),
      to: new Date(2026, 5, 15, 23, 59, 59),
    });
    expect(createUploadQueueDatePresetRange('last7days', now)).toEqual({
      from: new Date(2026, 5, 9),
      to: new Date(2026, 5, 15, 23, 59, 59),
    });
    expect(createUploadQueueDatePresetRange('lastMonth', now)).toEqual({
      from: new Date(2026, 4, 1),
      to: new Date(2026, 4, 31, 23, 59, 59),
    });
  });

  it('creates preview file metadata and queue toast messages', () => {
    expect(createUploadQueuePreviewFile({
      id: 'queue-1',
      status: 'success',
      file_name: 'resume.pdf',
      file_size: 1024,
      upload_date: '2026-01-01',
    })).toEqual({
      fileName: 'resume.pdf',
      url: '/api/upload-queue/queue-1/file',
      label: 'Upload Queue File',
      updatedAt: '2026-01-01',
      fileSize: 1024,
    });

    expect(getUploadQueueSummaryToastMessage({ queued: 1, inprocess: 2, success: 3, error: 4 })).toBe(
      'Queue updated: 1 queued, 2 processing, 3 completed, 4 errors'
    );
    expect(getUploadQueueSummaryToastMessage(null)).toBeNull();
  });

  it('updates queue data optimistically for retry and delete actions', () => {
    const queueData: QueueResponse = {
      total: 2,
      data: [
        {
          id: '1',
          file_name: 'one.pdf',
          file_size: 1,
          status: 'failed',
          error: 'bad',
          error_details: 'details',
          upload_date: '2026-01-01',
          updated_at: '2026-01-01',
          file_path: '/one.pdf',
          process_date: '2026-01-01',
          completed_date: '2026-01-01',
          user_id: 'user-1',
        },
        {
          id: '2',
          file_name: 'two.pdf',
          file_size: 2,
          status: 'success',
          upload_date: '2026-01-01',
          updated_at: '2026-01-01',
          file_path: '/two.pdf',
          user_id: 'user-1',
        },
      ],
    };

    expect(markUploadQueueItemQueued(queueData, '1')?.data[0]).toMatchObject({
      id: '1',
      status: 'queued',
      error: undefined,
      error_details: undefined,
      process_date: undefined,
      completed_date: undefined,
    });

    expect(removeUploadQueueItem(queueData, '2')).toMatchObject({
      total: 1,
      data: [expect.objectContaining({ id: '1' })],
    });
    expect(removeUploadQueueItem({ ...queueData, total: 0 }, '2')?.total).toBe(0);
  });

  it('builds retry error and bulk retry toast messages', () => {
    expect(getUploadQueueRetryErrorMessage('there is already a queued job with the same file path')).toContain('already a queued job');
    expect(getUploadQueueRetryErrorMessage('Forbidden')).toBe('No permission');
    expect(getUploadQueueRetryErrorMessage('Custom failure')).toBe('Custom failure');
    expect(getUploadQueueRetryErrorMessage()).toBe('Failed to retry job');

    expect(getUploadQueueBulkRetryToastMessages({ successCount: 2, failedDetails: [] })).toEqual({
      successMessage: 'Jobs queued for retry',
      errorMessage: null,
    });
    expect(getUploadQueueBulkRetryToastMessages({ successCount: 1, failedDetails: [{ reason: 'duplicate' }] })).toEqual({
      successMessage: '1 jobs queued for retry',
      errorMessage: '1 job failed to retry: duplicate',
    });
    expect(getUploadQueueBulkRetryToastMessages({ failedDetails: [{}, {}] })).toEqual({
      successMessage: null,
      errorMessage: '2 jobs failed to retry. Check console for details.',
    });
  });
});
