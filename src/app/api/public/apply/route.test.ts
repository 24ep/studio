import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const queryMock = vi.fn();
const releaseMock = vi.fn();
const putObjectMock = vi.fn();
const ensureBucketExistsMock = vi.fn();
const getSystemSettingMock = vi.fn();
const processSingleUploadQueueJobMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock('@/lib/db', () => ({
  getPool: () => ({
    connect: async () => ({
      query: queryMock,
      release: releaseMock,
    }),
  }),
}));

vi.mock('@/lib/minio', () => ({
  ensureBucketExists: ensureBucketExistsMock,
  minioClient: {
    putObject: putObjectMock,
  },
  MINIO_BUCKET: 'test-bucket',
}));

vi.mock('@/lib/fileUtils', () => ({
  generateUniqueFilename: (fileName: string, jobId: string) => `${jobId}-${fileName}`,
}));

vi.mock('@/lib/systemSettings', () => ({
  getSystemSetting: getSystemSettingMock,
}));

vi.mock('@/lib/uploadQueueProcessor', () => ({
  processSingleUploadQueueJob: processSingleUploadQueueJobMock,
}));

vi.mock('@/lib/emailService', () => ({
  sendEmail: sendEmailMock,
}));

function makeGetRequest(url = 'https://example.test/api/public/apply') {
  const nextUrl = new URL(url);
  return { url, nextUrl } as unknown as NextRequest;
}

function makePostRequest(formData: FormData) {
  const url = 'https://example.test/api/public/apply';
  return {
    url,
    nextUrl: new URL(url),
    formData: async () => formData,
  } as unknown as NextRequest;
}

function publicApplyForm(overrides: Record<string, string | File | null> = {}) {
  const formData = new FormData();
  formData.set('name', 'Jane Candidate');
  formData.set('email', 'jane@example.com');
  formData.set('phone', '+1 555 0100');
  formData.set('positionId', 'position-1');
  formData.set('source', 'public_apply');
  formData.set('resume', new File(['resume'], 'resume.pdf', { type: 'application/pdf' }));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) {
      formData.delete(key);
    } else {
      formData.set(key, value);
    }
  }

  return formData;
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

function mockSystemSettings(settings: Record<string, string | null> = {}) {
  getSystemSettingMock.mockImplementation(async (key: string) => settings[key] ?? null);
}

describe('/api/public/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    releaseMock.mockReset();
    queryMock.mockReset();
    putObjectMock.mockResolvedValue(undefined);
    ensureBucketExistsMock.mockResolvedValue(undefined);
    processSingleUploadQueueJobMock.mockResolvedValue({ success: true });
    sendEmailMock.mockResolvedValue({ success: true });
    mockSystemSettings();
  });

  it('returns public positions with clean apply paths and selected slug match', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: 'position-1',
        title: 'Business Analyst',
        department: 'Product',
        description: null,
        positionLevel: 'Senior',
        customAttributes: { publicApplySlug: 'business-analyst' },
        recruiterEmail: 'recruiter@example.com',
        recruiterName: 'Recruiter',
      }],
    });

    const { GET } = await import('./route');
    const response = await GET(makeGetRequest('https://example.test/api/public/apply?slug=business-analyst'));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.enabled).toBe(true);
    expect(body.selectedPositionId).toBe('position-1');
    expect(body.positions).toEqual([expect.objectContaining({
      id: 'position-1',
      publicApplyPath: '/apply/business-analyst',
    })]);
  });

  it('rejects submission when public applications are disabled', async () => {
    mockSystemSettings({ publicApplicationsEnabled: 'false' });

    const { POST } = await import('./route');
    const response = await POST(makePostRequest(publicApplyForm()));
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body.message).toBe('Public applications are currently closed');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('requires captcha when enabled', async () => {
    mockSystemSettings({ publicApplicationsRequireCaptcha: 'true' });

    const { POST } = await import('./route');
    const response = await POST(makePostRequest(publicApplyForm()));
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body.message).toBe('Please complete the verification challenge');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('accepts honeypot spam without creating a queue job', async () => {
    const { POST } = await import('./route');
    const response = await POST(makePostRequest(publicApplyForm({ website: 'https://spam.test' })));
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body.message).toBe('Application received');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('stores, processes, and notifies for a valid public application', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 'position-1',
          title: 'Business Analyst',
          department: 'Product',
          description: null,
          positionLevel: 'Senior',
          customAttributes: {},
          recruiterEmail: 'recruiter@example.com',
          recruiterName: 'Rina Recruiter',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'queue-1',
          file_name: 'resume.pdf',
          file_path: 'public-applications/resume.pdf',
          webhook_payload: {},
        }],
      });

    const { POST } = await import('./route');
    const response = await POST(makePostRequest(publicApplyForm()));
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body.message).toBe('Application received');
    expect(ensureBucketExistsMock).toHaveBeenCalledTimes(1);
    expect(putObjectMock).toHaveBeenCalledTimes(1);
    expect(processSingleUploadQueueJobMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      'jane@example.com',
      expect.stringContaining('Application received'),
      expect.stringContaining('Business Analyst')
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      'recruiter@example.com',
      expect.stringContaining('New public application'),
      expect.stringContaining('Jane Candidate')
    );
  });
});
