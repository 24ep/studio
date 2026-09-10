import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { getPool, type DbClient } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import { buildApplicantsExportFilterQuery } from './applicants-export-filters';
import { queryApplicantsForExport } from './applicants-export-data';
import {
  convertToCsv,
  createApplicantsExportExcelBuffer,
  transformApplicantForExport,
  type ApplicantsExportRow,
} from './applicants-export-format';

function getExportErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to export Applicants';
  }

  if (error.message.includes('connection') || error.message.includes('pool')) {
    return 'Database connection error. Please try again.';
  }
  if (error.message.includes('timeout')) {
    return 'Export timed out. Please try with fewer filters or contact support.';
  }
  if (error.message.includes('memory') || error.message.includes('heap')) {
    return 'Export too large. Please try with fewer filters.';
  }
  if (error.message.includes('permission') || error.message.includes('access')) {
    return 'Permission denied. Please check your access rights.';
  }

  return 'Failed to export Applicants';
}

function getErrorDetails(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

async function authorizeApplicantsExport() {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    await logAudit('WARN', 'Unauthorized attempt to export Applicants', 'API:Applicants:Export', null);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'applicantS_EXPORT')) {
    await logAudit('WARN', `Forbidden attempt to export Applicants by ${actingUserName}`, 'API:Applicants:Export', actingUserId);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to export Applicants' }, { status: 403 }),
    };
  }

  const exportImportFeatureEnabled = await getSystemSetting('exportImportFeatureEnabled');
  if (exportImportFeatureEnabled === 'false') {
    await logAudit('WARN', `Export attempt blocked - feature disabled by ${actingUserName}`, 'API:Applicants:Export', actingUserId);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Export/Import feature is disabled' }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    actingUserId,
    actingUserName,
  };
}

async function createExportResponse(
  request: NextRequest,
  exportData: ApplicantsExportRow[],
  isJobMatchEnabled: boolean,
  exportCount: number,
  actingUserId: string,
  actingUserName: string
) {
  const format = new URL(request.url).searchParams.get('format') || 'excel';

  if (format === 'excel') {
    const excelBuffer = await createApplicantsExportExcelBuffer(exportData, isJobMatchEnabled);

    await logAudit('AUDIT', `Applicants exported as Excel by ${actingUserName}. ${exportCount} Applicants exported.`, 'API:Applicants:Export', actingUserId, {
      exportCount,
      format: 'Excel',
    });

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="applicants_export.xlsx"',
      },
    });
  }

  const csvData = convertToCsv(exportData);

  await logAudit('AUDIT', `Applicants exported as CSV by ${actingUserName}. ${exportCount} Applicants exported.`, 'API:Applicants:Export', actingUserId, {
    exportCount,
    format: 'CSV',
  });

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="applicants_export.csv"',
    },
  });
}

export async function handleExportApplicantsGet(request: NextRequest) {
  const authorization = await authorizeApplicantsExport();
  if (!authorization.ok) {
    return authorization.response;
  }

  let client: DbClient | null = null;
  try {
    const jobMatchFeatureEnabled = await getSystemSetting('jobMatchFeatureEnabled');
    const isJobMatchEnabled = jobMatchFeatureEnabled !== 'false';
    const { whereClause, queryParams } = buildApplicantsExportFilterQuery(new URL(request.url).searchParams);

    client = await getPool().connect();
    const result = await queryApplicantsForExport(client, whereClause, queryParams, isJobMatchEnabled);
    const exportData = result.rows.map((applicant) => transformApplicantForExport(applicant, isJobMatchEnabled));

    return createExportResponse(
      request,
      exportData,
      isJobMatchEnabled,
      result.rows.length,
      authorization.actingUserId,
      authorization.actingUserName
    );
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error('Export error details:', {
      error: errorDetails.message,
      stack: errorDetails.stack,
      actingUserName: authorization.actingUserName,
      actingUserId: authorization.actingUserId,
    });

    await logAudit('ERROR', `Failed to export Applicants by ${authorization.actingUserName}. Error: ${errorDetails.message}`, 'API:Applicants:Export', authorization.actingUserId, {
      error: errorDetails.message,
      stack: errorDetails.stack,
    });

    return NextResponse.json({
      error: getExportErrorMessage(error),
      details: errorDetails.message,
    }, { status: 500 });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing database client:', releaseError);
      }
    }
  }
}
