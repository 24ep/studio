export const runtime = 'nodejs';

import { after, NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  configureProductionEnvironment,
  enqueueDemoInstallation,
  getDemoInstallationJob,
  processDemoInstallationQueue,
} from '@/lib/demo-installation-queue';
import { installationEnvironmentSchema } from '@/lib/platform-installation';
import { readRequestJsonResult } from '@/lib/request-json';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'Admin') {
    return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  }
  const body = await readRequestJsonResult(request);
  const input = body.ok ? installationEnvironmentSchema.safeParse(body.value) : null;
  if (!input?.success) {
    return NextResponse.json({ message: 'Choose a valid installation environment.' }, { status: 400 });
  }
  try {
    if (input.data.environment === 'production') {
      return NextResponse.json(await configureProductionEnvironment(session.user.id));
    }
    const job = await enqueueDemoInstallation(input.data, session.user.id);
    after(async () => { await processDemoInstallationQueue(); });
    return NextResponse.json({ jobId: job.id, status: job.status, progress: job.progress }, { status: 202 });
  } catch (error) {
    console.error('Installation environment setup failed:', error);
    const detail = error instanceof Error ? error.message : '';
    const status = detail.includes('already been configured') || detail.includes('already in progress') ? 409 : detail.includes('Only the administrator') ? 403 : 500;
    const message = status === 409 || status === 403 ? detail : 'Unable to initialize the installation environment.';
    return NextResponse.json({ message }, { status });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'Admin') {
    return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  }
  const job = await getDemoInstallationJob(request.nextUrl.searchParams.get('jobId'), session.user.id);
  if (job && (job.status === 'pending' || job.status === 'processing')) {
    after(async () => { await processDemoInstallationQueue(); });
  }
  return NextResponse.json({ job });
}
