import { describe, expect, it } from 'vitest';
import {
  buildResumeObjectName,
  buildResumeUploadPermissionFlags,
  buildResumeUploadWebhookPayload,
  canAttemptResumeUpload,
  normalizeResumeUploadSourceId,
} from './resume-upload-route-utils';

describe('resume-upload-route-utils', () => {
  it('normalizes source id form values', () => {
    expect(normalizeResumeUploadSourceId('source-1')).toBe('source-1');
    expect(normalizeResumeUploadSourceId('null')).toBeNull();
    expect(normalizeResumeUploadSourceId('')).toBeNull();
    expect(normalizeResumeUploadSourceId(null)).toBeNull();
  });

  it('builds resume upload permission flags', () => {
    const user = { id: 'user-1', modulePermissions: ['applicantS_RESUMES_UPLOAD_OWN'] };
    const flags = buildResumeUploadPermissionFlags(user, (sessionUser, permissions) => (
      permissions.some(permission => sessionUser?.modulePermissions?.includes(permission))
    ));

    expect(flags).toEqual({
      hasGlobalResumePermission: false,
      hasOwnResumePermission: true,
    });
    expect(canAttemptResumeUpload(flags)).toBe(true);
  });

  it('builds object names and webhook payloads', () => {
    expect(buildResumeObjectName('applicant-1', 'cv.pdf')).toBe('resumes/applicant-1/cv.pdf');
    expect(buildResumeUploadWebhookPayload({
      applicantId: 'applicant-1',
      actingUserId: 'user-1',
      fileName: 'cv.pdf',
      fileUrl: '/api/secure-file/stream?filePath=resumes%2Fapplicant-1%2Fcv.pdf',
      mimeType: 'application/pdf',
      positionId: 'position-1',
      sourceId: null,
    })).toEqual({
      inputs: {
        cv_url: '/api/secure-file/stream?filePath=resumes%2Fapplicant-1%2Fcv.pdf',
        Applicant_id: 'applicant-1',
        jobId: 'position-1',
        filename: 'cv.pdf',
        mimetype: 'application/pdf',
      },
      response_mode: 'blocking',
      user: 'user-1',
      request_type: 'create',
      sourceId: null,
    });
  });
});
