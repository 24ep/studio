import { type NextRequest } from 'next/server';
import { getSystemSetting } from '@/lib/systemSettings';
import {
  requireV1ApplicantImportPermission,
  requireV1ApplicantImportUser,
} from './applicants-import-v1-auth';
import { importV1ApplicantsToDatabase } from './applicants-import-v1-data';
import {
  readV1ApplicantImportApplicants,
  validateV1ApplicantImportApplicants,
} from './applicants-import-v1-request';
import {
  jsonV1ApplicantImportResponse,
  optionsV1ApplicantImportResponse,
} from './applicants-import-v1-response';
import { getV1ApplicantImportTemplate } from './applicants-import-v1-template';

export async function handleV1ApplicantImportPost(request: NextRequest) {
  const auth = await requireV1ApplicantImportUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const permission = requireV1ApplicantImportPermission(request, auth.user);
  if (!permission.ok) {
    return permission.response;
  }

  const exportImportFeatureEnabled = await getSystemSetting('exportImportFeatureEnabled');
  if (exportImportFeatureEnabled === 'false') {
    return jsonV1ApplicantImportResponse(request, { error: 'Export/Import feature is disabled' }, 403);
  }

  const parsedRequest = await readV1ApplicantImportApplicants(request);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const validation = validateV1ApplicantImportApplicants(request, parsedRequest.applicants);
  if (!validation.ok) {
    return validation.response;
  }

  try {
    const result = await importV1ApplicantsToDatabase(validation.applicants, auth.user);
    if (result.status === 'stage-not-found') {
      return jsonV1ApplicantImportResponse(
        request,
        { error: 'Unable to resolve a valid recruitment stage for a Applicant' },
        400
      );
    }

    return jsonV1ApplicantImportResponse(request, {
      message: 'Import completed',
      results: result.results,
    });
  } catch (error) {
    return jsonV1ApplicantImportResponse(
      request,
      { error: 'Error importing Applicants', details: (error as Error).message },
      500
    );
  }
}

export async function handleV1ApplicantImportGet(request: NextRequest) {
  const auth = await requireV1ApplicantImportUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  return jsonV1ApplicantImportResponse(request, getV1ApplicantImportTemplate());
}

export function handleV1ApplicantImportOptions(request: NextRequest) {
  return optionsV1ApplicantImportResponse(request);
}
