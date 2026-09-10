import { after, NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { enqueueDataOperation, getDataOperationJobs, processDataOperationQueue, type DataOperation, type DataOperationEntity } from '@/lib/data-operation-queue';
import { getSystemSetting } from '@/lib/systemSettings';
import type { Session } from 'next-auth';
import { parseBusinessTransferPackage } from '@/lib/data-model-backup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function canOperate(user: Session['user'], operation: DataOperation, entity: DataOperationEntity) {
  if (entity === 'system-transfer') return user.role === 'Admin';
  const permission = entity === 'applicants'
    ? (operation === 'import' ? 'applicantS_IMPORT' : 'applicantS_EXPORT')
    : (operation === 'import' ? 'POSITIONS_IMPORT' : 'POSITIONS_EXPORT');
  return hasPermission(user, permission);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const includeAllUsers = session.user.role === 'Admin' || hasPermission(session.user, 'UPLOAD_QUEUE_VIEW');
  return NextResponse.json({ jobs: await getDataOperationJobs(session.user.id, includeAllUsers) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (await getSystemSetting('exportImportFeatureEnabled') === 'false') return NextResponse.json({ error: 'Export/Import feature is disabled' }, { status: 403 });

  try {
    const form = await request.formData();
    const operation = form.get('operation');
    const entityType = form.get('entityType');
    if ((operation !== 'import' && operation !== 'export') || (entityType !== 'applicants' && entityType !== 'positions' && entityType !== 'system-transfer')) {
      return NextResponse.json({ error: 'Unsupported data operation' }, { status: 400 });
    }
    if (!canOperate(session.user, operation, entityType)) return NextResponse.json({ error: 'Forbidden: insufficient permission for this operation' }, { status: 403 });

    const fileValue = form.get('file');
    const file = fileValue instanceof File ? fileValue : undefined;
    if (operation === 'import' && !file) return NextResponse.json({ error: 'No import file uploaded' }, { status: 400 });
    if (file && entityType === 'positions' && !file.name.toLowerCase().endsWith('.csv')) return NextResponse.json({ error: 'Position imports require a CSV file.' }, { status: 400 });
    if (file && entityType === 'applicants' && !/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: 'Applicant imports require an Excel or CSV file.' }, { status: 400 });
    if (file && entityType === 'system-transfer' && !/\.jsonl$/i.test(file.name) && !/\.json$/i.test(file.name)) return NextResponse.json({ error: 'System data transfers require a JSONL package.' }, { status: 400 });

    let validation: Record<string, unknown> | undefined;
    if (operation === 'import' && entityType === 'system-transfer' && file) {
      const packageData = await parseBusinessTransferPackage(Buffer.from(await file.arrayBuffer()));
      validation = { domains: packageData.domains, modelCount: packageData.models.length, rowCount: packageData.models.reduce((sum, model) => sum + model.rows.length, 0), schemaVersion: packageData.schemaVersion };
    }

    let parameters: Record<string, unknown> = {};
    const rawParameters = form.get('parameters');
    if (typeof rawParameters === 'string' && rawParameters) parameters = JSON.parse(rawParameters) as Record<string, unknown>;
    const queued = await enqueueDataOperation({ operation, entityType, format: String(form.get('format') || ''), file, parameters, requestedById: session.user.id });
    after(async () => { await processDataOperationQueue(); });
    return NextResponse.json({ message: 'Operation added to the queue', jobId: queued.id, status: 'pending', validation }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not queue the operation';
    const status = message.includes('File too large') ? 413 : message.includes('active jobs') ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
