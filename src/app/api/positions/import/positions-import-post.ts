import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { getDefaultMatchCriteria, getSystemSetting } from '@/lib/systemSettings';
import { hasPermission } from '@/lib/permissions';
import { executePositionImport } from './positions-import-batch';
import { parseCsvImportFile } from './positions-import-csv';
import { importPositionsArraySchema, MAX_POSITIONS } from './positions-import-schema';
import type { Session } from 'next-auth';

function getActor(session: Session | null) {
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  return { actingUserId, actingUserName };
}

async function parseJsonBody(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return { ok: false as const, response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }) };
  }

  return { ok: true as const, body: result.value };
}

async function parseMultipartPositions(request: NextRequest, defaultMatchCriteria: string) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'No file uploaded' }, { status: 400 }),
    };
  }

  const csvResult = await parseCsvImportFile(file, defaultMatchCriteria);
  if (!csvResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(csvResult.body, { status: csvResult.status }),
    };
  }

  return {
    ok: true as const,
    positions: csvResult.positions,
  };
}

export async function handleImportPositionsPost(request: NextRequest) {
  const session = await auth();
  const { actingUserId, actingUserName } = getActor(session);

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!session?.user || !hasPermission(session.user, 'POSITIONS_IMPORT')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to import positions' }, { status: 403 });
  }

  if (await getSystemSetting('exportImportFeatureEnabled') === 'false') {
    return NextResponse.json({ message: 'Export/Import feature is disabled' }, { status: 403 });
  }

  const defaultMatchCriteria = await getDefaultMatchCriteria();
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    try {
      const parsed = await parseMultipartPositions(request, defaultMatchCriteria);
      if (!parsed.ok) {
        return parsed.response;
      }

      const validationResult = importPositionsArraySchema.safeParse(parsed.positions);
      if (!validationResult.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
      }

      return executePositionImport({
        positions: validationResult.data,
        defaultMatchCriteria,
        actingUserId,
        actingUserName,
        auditInput: parsed.positions,
        successAuditLabel: 'Bulk import (CSV) completed',
        timeoutMessage: 'Import timeout. Please try with a smaller file or contact support.',
      });
    } catch (error) {
      console.error('Import error:', error);
      return NextResponse.json({
        message: 'Error processing file',
        ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' }),
      }, { status: 500 });
    }
  }

  const jsonResult = await parseJsonBody(request);
  if (!jsonResult.ok) {
    return jsonResult.response;
  }

  const validationResult = importPositionsArraySchema.safeParse(jsonResult.body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  if (validationResult.data.length > MAX_POSITIONS) {
    return NextResponse.json({
      message: `Too many positions. Maximum allowed is ${MAX_POSITIONS}. Found ${validationResult.data.length} positions.`,
    }, { status: 400 });
  }

  return executePositionImport({
    positions: validationResult.data,
    defaultMatchCriteria,
    actingUserId,
    actingUserName,
    auditInput: jsonResult.body,
    successAuditLabel: 'Bulk import completed',
    timeoutMessage: 'Import timeout. Please try with fewer positions or contact support.',
  });
}
