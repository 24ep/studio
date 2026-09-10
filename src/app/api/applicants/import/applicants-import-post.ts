import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { filterImportRowsWithRequiredFields, parseApplicantImportFile } from './applicants-import-file-parser';
import { requireApplicantImportAccess } from './applicants-import-auth';
import { importApplicantsToDatabase } from './applicants-import-db';
import { applicantImportSchema } from './applicants-import-schema';

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

function validateImportRows(applicants: ReturnType<typeof filterImportRowsWithRequiredFields>) {
  return applicants.map((applicant, index) => {
    const result = applicantImportSchema.safeParse(applicant);
    return {
      index,
      applicant,
      valid: result.success,
      errors: result.success ? null : result.error.flatten().fieldErrors,
      data: result.success ? result.data : null,
    };
  });
}

export async function handleImportApplicantsPost(request: NextRequest) {
  const access = await requireApplicantImportAccess({ auditUnauthorized: true, auditForbidden: true });
  if (!access.ok) {
    return access.response;
  }

  const { actingUserId, actingUserName } = access.actor;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 });
    }

    const parsedFile = await parseApplicantImportFile(file);
    const validRows = filterImportRowsWithRequiredFields(parsedFile.applicants);

    if (validRows.length === 0) {
      return NextResponse.json({
        error: 'No valid Applicants found in file. Please ensure the file contains Applicant data with at least Name and Email fields filled.',
      }, { status: 400 });
    }

    const validationResults = validateImportRows(validRows);
    const invalidApplicants = validationResults.filter((result) => !result.valid);
    if (invalidApplicants.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: invalidApplicants.map((result) => ({
          row: result.index + 2,
          email: result.applicant.email,
          errors: result.errors,
        })),
      }, { status: 400 });
    }

    const applicants = validationResults.flatMap((result) => (result.data ? [result.data] : []));
    const results = await importApplicantsToDatabase(applicants);

    await logAudit(
      'AUDIT',
      `Applicants imported by ${actingUserName}. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors.length}`,
      'API:Applicants:Import',
      actingUserId,
      {
        created: results.created,
        updated: results.updated,
        errors: results.errors.length,
        totalProcessed: validRows.length,
        totalRows: parsedFile.totalRows,
      }
    );

    return NextResponse.json({
      message: 'Import completed successfully',
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Unsupported file type') ? 400 : 500;

    await logAudit('ERROR', `Failed to import Applicants by ${actingUserName}. Error: ${message}`, 'API:Applicants:Import', actingUserId, {
      error: message,
    });

    return NextResponse.json({ error: status === 400 ? message : 'Failed to import Applicants', details: message }, { status });
  }
}
