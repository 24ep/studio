import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { validateFileUpload } from '@/lib/security';
import {
  isResumeUploadFile,
  normalizeResumeUploadSourceId,
} from './resume-upload-route-utils';

export interface ParsedResumeUploadRequest {
  file: File;
  positionId: string;
  sourceId: string | null;
  targetApplicantId: string;
}

interface ParseResumeUploadRequestInput {
  actingUserId: string;
  actingUserName: string;
  formData: FormData;
  targetApplicantId: string | null;
}

export async function parseResumeUploadRequest({
  actingUserId,
  actingUserName,
  formData,
  targetApplicantId,
}: ParseResumeUploadRequestInput): Promise<
  | { ok: true; value: ParsedResumeUploadRequest }
  | { ok: false; response: NextResponse }
> {
  if (!targetApplicantId) {
    await logAudit('WARN', `Resume upload attempted without applicantId by ${actingUserName}`, 'API:Resumes:Upload', actingUserId);
    return { ok: false, response: NextResponse.json({ message: 'Missing applicantId' }, { status: 400 }) };
  }

  const file = formData.get('resume');
  const positionId = formData.get('position_id') as string | null;
  const sourceId = normalizeResumeUploadSourceId(formData.get('source_id'));

  if (!isResumeUploadFile(file)) {
    await logAudit('WARN', `Resume upload attempted without file by ${actingUserName} for Applicant ${targetApplicantId}`, 'API:Resumes:Upload', actingUserId, { applicantId: targetApplicantId });
    return { ok: false, response: NextResponse.json({ message: 'No file uploaded' }, { status: 400 }) };
  }

  if (!positionId) {
    await logAudit('ERROR', `Resume upload failed - missing position_id by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, { applicantId: targetApplicantId, fileName: file.name });
    return { ok: false, response: NextResponse.json({ message: 'position_id is required.' }, { status: 400 }) };
  }

  const validation = await validateFileUpload(file.name, file.type, file.size);
  if (!validation.valid) {
    await logAudit('WARN', `Resume upload rejected: ${validation.errors.join(', ')} by ${actingUserName}`, 'API:Resumes:Upload', actingUserId, { applicantId: targetApplicantId, fileName: file.name });
    return {
      ok: false,
      response: NextResponse.json({ message: 'Invalid file', errors: validation.errors }, { status: 400 }),
    };
  }

  return {
    ok: true,
    value: {
      file,
      positionId,
      sourceId,
      targetApplicantId,
    },
  };
}
