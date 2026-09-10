import { type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { parseV1ApplicantImportFile, UnsupportedV1ApplicantImportFileError } from './applicants-import-v1-file';
import { jsonV1ApplicantImportResponse } from './applicants-import-v1-response';
import { v1ApplicantImportSchema } from './applicants-import-v1-schema';

export async function readV1ApplicantImportApplicants(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return {
          ok: false as const,
          response: jsonV1ApplicantImportResponse(request, { error: 'No file uploaded' }, 400),
        };
      }

      return { ok: true as const, applicants: await parseV1ApplicantImportFile(file) };
    } catch (error) {
      if (error instanceof UnsupportedV1ApplicantImportFileError) {
        return {
          ok: false as const,
          response: jsonV1ApplicantImportResponse(request, { error: error.message }, 400),
        };
      }

      return {
        ok: false as const,
        response: jsonV1ApplicantImportResponse(
          request,
          { error: 'Failed to parse file', details: (error as Error).message },
          400
        ),
      };
    }
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const validationResult = v1ApplicantImportSchema.safeParse(bodyResult.ok ? bodyResult.value : undefined);
    if (!validationResult.success) {
      return {
        ok: false as const,
        response: jsonV1ApplicantImportResponse(
          request,
          { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
          400
        ),
      };
    }

    return { ok: true as const, applicants: validationResult.data.applicants };
  } catch {
    return {
      ok: false as const,
      response: jsonV1ApplicantImportResponse(request, { error: 'Invalid JSON body' }, 400),
    };
  }
}

export function validateV1ApplicantImportApplicants(request: NextRequest, applicants: unknown[]) {
  const validationResult = v1ApplicantImportSchema.safeParse({ applicants });
  return validationResult.success
    ? { ok: true as const, applicants: validationResult.data.applicants }
    : {
        ok: false as const,
        response: jsonV1ApplicantImportResponse(
          request,
          { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
          400
        ),
      };
}
