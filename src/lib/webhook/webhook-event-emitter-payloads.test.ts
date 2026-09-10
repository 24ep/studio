import { describe, expect, it } from 'vitest';

import {
  buildApplicantStageChangedPayload,
  buildResumePayload,
  buildUploadQueuePayload,
  buildUploadQueueRetryPayload,
  getUploadQueueSourceInfo,
} from './webhook-event-emitter-payloads';

describe('webhook event emitter payload builders', () => {
  it('builds applicant stage change payloads with fallback status', () => {
    expect(buildApplicantStageChangedPayload(
      {
        id: 'applicant-1',
        name: 'Ada',
        email: 'ada@example.com',
        statusName: 'Applied',
        positionId: 'position-1',
        applicationDate: '2026-06-10',
      },
      'Applied',
      'Hired',
      '2026-06-10T00:00:00.000Z',
    )).toMatchObject({
      applicant: {
        id: 'applicant-1',
        status: 'Applied',
        position_id: 'position-1',
      },
      stage_change: {
        old_stage: 'Applied',
        new_stage: 'Hired',
        changed_at: '2026-06-10T00:00:00.000Z',
      },
    });
  });

  it('builds resume payloads', () => {
    expect(buildResumePayload({
      id: 'resume-1',
      applicantId: 'applicant-1',
      fileName: 'resume.pdf',
      filePath: '/uploads/resume.pdf',
      uploadedAt: '2026-06-10T00:00:00.000Z',
      fileSize: 1200,
    })).toEqual({
      id: 'resume-1',
      applicant_id: 'applicant-1',
      file_name: 'resume.pdf',
      file_path: '/uploads/resume.pdf',
      uploaded_at: '2026-06-10T00:00:00.000Z',
      file_size: 1200,
    });
  });

  it('builds upload queue payloads with optional source metadata', () => {
    const uploadQueue = {
      id: 'queue-1',
      fileName: 'resume.pdf',
      webhook_payload: {
        sourceId: 'source-1',
        targetPositionId: 'position-1',
      },
    };

    expect(getUploadQueueSourceInfo(uploadQueue)).toEqual({
      sourceId: 'source-1',
      targetPositionId: 'position-1',
    });
    expect(buildUploadQueuePayload(uploadQueue)).toMatchObject({
      id: 'queue-1',
      file_name: 'resume.pdf',
      source: {
        sourceId: 'source-1',
        targetPositionId: 'position-1',
      },
    });
    expect(buildUploadQueueRetryPayload(
      uploadQueue,
      2,
      '2026-06-10T00:00:00.000Z',
    )).toMatchObject({
      upload_queue: { id: 'queue-1' },
      retry: {
        attempt: 2,
        retry_at: '2026-06-10T00:00:00.000Z',
      },
    });
  });
});
