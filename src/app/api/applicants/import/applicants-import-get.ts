import { NextResponse } from 'next/server';
import { requireApplicantImportAccess } from './applicants-import-auth';
import { buildApplicantImportTemplateBuffer } from './applicants-import-template';

export async function handleGetApplicantImportTemplate() {
  const access = await requireApplicantImportAccess();
  if (!access.ok) {
    return access.response;
  }

  try {
    const excelBuffer = await buildApplicantImportTemplateBuffer();
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="applicants_import_template.xlsx"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate template', details: message }, { status: 500 });
  }
}
