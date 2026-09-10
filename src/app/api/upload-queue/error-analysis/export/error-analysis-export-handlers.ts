import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { stringifyErrorAnalysisCsv, buildErrorAnalysisCsvHeaders } from './error-analysis-export-csv';
import { fetchErrorAnalysisRows } from './error-analysis-export-data';
import { parseErrorAnalysisExportFilters } from './error-analysis-export-request';
import { buildErrorAnalysisExport } from './error-analysis-export-transform';

const AUDIT_ACTION = 'API:UploadQueue:ErrorAnalysis:Export';

export async function handleExportErrorAnalysis(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    await logAudit('WARN', 'Unauthorized attempt to export error analysis', AUDIT_ACTION, null);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const filters = parseErrorAnalysisExportFilters(request);
    const exportDate = new Date().toISOString().split('T')[0];
    const rows = await fetchErrorAnalysisRows(filters);
    const exportData = buildErrorAnalysisExport(rows, exportDate);

    if (filters.format === 'excel') {
      await logExportSuccess(actingUserName, actingUserId, 'Excel', exportData.summary.length - 1, exportData.metadata);
      return NextResponse.json({
        summary: exportData.summary,
        details: exportData.details,
        metadata: {
          ...exportData.metadata,
          exportDate: new Date().toISOString(),
          filters: {
            dateStart: filters.dateStart,
            dateEnd: filters.dateEnd,
            status: filters.status,
          },
        },
      });
    }

    await logExportSuccess(actingUserName, actingUserId, 'CSV', exportData.summary.length - 1, exportData.metadata);
    return new NextResponse(stringifyErrorAnalysisCsv(exportData.summary), {
      status: 200,
      headers: buildErrorAnalysisCsvHeaders(exportDate),
    });
  } catch (error) {
    console.error('Error exporting error analysis:', error);

    await logAudit(
      'ERROR',
      `Failed to export error analysis by ${actingUserName}. Error: ${(error as Error).message}`,
      AUDIT_ACTION,
      actingUserId,
      { error: (error as Error).message }
    );

    return NextResponse.json({ error: 'Failed to export error analysis' }, { status: 500 });
  }
}

async function logExportSuccess(
  actingUserName: string,
  actingUserId: string,
  format: 'CSV' | 'Excel',
  exportCount: number,
  metadata: { totalJobs: number; totalErrors: number }
) {
  await logAudit(
    'AUDIT',
    `Error analysis exported as ${format} by ${actingUserName}. ${exportCount} error types exported.`,
    AUDIT_ACTION,
    actingUserId,
    {
      exportCount,
      format,
      totalJobs: metadata.totalJobs,
      totalErrors: metadata.totalErrors,
    }
  );
}
