import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  APPLICANT_EXPORT_AUDIT_ACTION,
  requireApplicantExportAccess,
} from './applicant-export-auth';
import { fetchApplicantExportData } from './applicant-export-data';
import { buildApplicantExportHeaders, buildApplicantExportWorkbookBuffer } from './applicant-export-excel';
import { resolveApplicantExportId, type ApplicantExportRouteContext } from './applicant-export-request';
import { transformApplicantForExport } from './applicant-export-transform';

export async function handleExportApplicant(request: NextRequest, context: ApplicantExportRouteContext) {
  const access = await requireApplicantExportAccess();
  if (!access.ok) {
    return access.response;
  }

  const idResult = await resolveApplicantExportId(request, context);
  if (!idResult.ok) {
    return NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 });
  }

  try {
    const exportData = await fetchApplicantExportData(idResult.id);
    if (!exportData) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    const exportRows = [transformApplicantForExport(exportData.applicant, exportData.jobMatches)];
    const excelBuffer = await buildApplicantExportWorkbookBuffer(exportRows);

    await logAudit(
      'AUDIT',
      `Applicant ${exportData.applicant.name} exported as Excel by ${access.actingUserName}`,
      APPLICANT_EXPORT_AUDIT_ACTION,
      access.actingUserId,
      {
        applicantId: idResult.id,
        applicantName: exportData.applicant.name,
        format: 'Excel',
      }
    );

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: buildApplicantExportHeaders(exportData.applicant.name),
    });
  } catch (error) {
    await logAudit(
      'ERROR',
      `Failed to export Applicant ${idResult.id} by ${access.actingUserName}. Error: ${(error as Error).message}`,
      APPLICANT_EXPORT_AUDIT_ACTION,
      access.actingUserId,
      {
        applicantId: idResult.id,
        error: (error as Error).message,
      }
    );
    return NextResponse.json({ error: 'Failed to export Applicant' }, { status: 500 });
  }
}
