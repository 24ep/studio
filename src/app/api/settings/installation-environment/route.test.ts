import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  configureProductionEnvironment: vi.fn(),
  enqueueDemoInstallation: vi.fn(),
  getDemoInstallationJob: vi.fn(),
  processDemoInstallationQueue: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/demo-installation-queue', () => ({
  configureProductionEnvironment: mocks.configureProductionEnvironment,
  enqueueDemoInstallation: mocks.enqueueDemoInstallation,
  getDemoInstallationJob: mocks.getDemoInstallationJob,
  processDemoInstallationQueue: mocks.processDemoInstallationQueue,
}));
vi.mock('next/server', async (importOriginal) => {
  const original = await importOriginal<typeof import('next/server')>();
  return { ...original, after: (callback: () => Promise<void>) => void callback() };
});

import { GET, POST } from './route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/settings/installation-environment', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('installation environment setup route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', role: 'Admin' } });
    mocks.processDemoInstallationQueue.mockResolvedValue(undefined);
  });

  it('rejects non-administrators', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'Recruiter' } });
    const response = await POST(request({ environment: 'production' }));
    expect(response.status).toBe(403);
    expect(mocks.configureProductionEnvironment).not.toHaveBeenCalled();
  });

  it('completes production setup without creating demo data', async () => {
    mocks.configureProductionEnvironment.mockResolvedValue({ environment: 'production', status: 'completed', progress: 100 });
    const response = await POST(request({ environment: 'production' }));
    expect(response.status).toBe(200);
    expect(mocks.configureProductionEnvironment).toHaveBeenCalledWith('admin-1');
    expect(mocks.enqueueDemoInstallation).not.toHaveBeenCalled();
  });

  it('queues bounded demo setup and starts background processing', async () => {
    mocks.enqueueDemoInstallation.mockResolvedValue({ id: 'job-1', status: 'pending', progress: 0 });
    const response = await POST(request({ environment: 'demo', employeeCount: 1000, historyMonths: 24 }));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ jobId: 'job-1', status: 'pending' });
    expect(mocks.enqueueDemoInstallation).toHaveBeenCalledWith({ environment: 'demo', employeeCount: 1000, historyMonths: 24 }, 'admin-1');
    expect(mocks.processDemoInstallationQueue).toHaveBeenCalledOnce();
  });

  it('returns only the requesting administrator job status', async () => {
    mocks.getDemoInstallationJob.mockResolvedValue({ id: 'job-1', status: 'processing', progress: 54 });
    const response = await GET(new NextRequest('http://localhost/api/settings/installation-environment?jobId=job-1'));
    expect(response.status).toBe(200);
    expect(mocks.getDemoInstallationJob).toHaveBeenCalledWith('job-1', 'admin-1');
  });
});
