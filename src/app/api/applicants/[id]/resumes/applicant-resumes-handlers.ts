import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import {
  addResumeUrl,
  addResumeUrls,
  countApplicantAttachments,
  createApplicantResumeAttachment,
  deleteApplicantAttachmentRecord,
  fetchApplicantAttachment,
  fetchApplicantForAttachmentDelete,
  fetchApplicantResumes,
  promoteNewestApplicantAttachment,
  setApplicantPrimaryResume,
} from './applicant-resumes-data';
import { getAttachmentDeletePermissionError } from './applicant-resumes-permissions';
import {
  isValidApplicantId,
  parseAttachmentIdBody,
  parseResumePagination,
  parseResumeUploadForm,
  resolveApplicantId,
} from './applicant-resumes-request';
import { deleteApplicantResumeFile, uploadApplicantResumeFile } from './applicant-resumes-storage';
import type { ApplicantResumesRouteContext } from './applicant-resumes-types';

export async function handleGetApplicantResumes(request: NextRequest, context: ApplicantResumesRouteContext) {
  const applicantId = await resolveApplicantId(context);
  const pagination = parseResumePagination(request);

  if (!isValidApplicantId(applicantId)) {
    return NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const [applicant, attachments] = await fetchApplicantResumes(applicantId, pagination);

    if (!applicant) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    const attachmentsWithUrl = await addResumeUrls(attachments);
    const queryTime = Date.now() - startTime;

    if (queryTime > 3000) {
      console.warn(`[PERF WARNING] Slow resumes query: ${queryTime}ms for Applicant ${applicantId}`);
    }

    return NextResponse.json({
      data: attachmentsWithUrl,
      pagination: {
        ...pagination,
        total: attachments.length,
        hasMore: attachments.length === pagination.limit,
      },
    });
  } catch (error) {
    console.error(`[GET /api/applicants/${applicantId}/resumes] Error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function handleUploadApplicantResumes(request: NextRequest, context: ApplicantResumesRouteContext) {
  const applicantId = await resolveApplicantId(context);
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { files, label } = await parseResumeUploadForm(request);
  if (!files || files.length === 0) {
    return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
  }

  const results = [];
  const errors = [];
  const currentCount = await countApplicantAttachments(applicantId);
  let isFirstFile = currentCount === 0;

  for (const file of files) {
    if (typeof file === 'string') {
      errors.push('Invalid file data');
      continue;
    }

    try {
      const objectName = await uploadApplicantResumeFile(applicantId, file);
      const newAttachment = await createApplicantResumeAttachment({
        applicantId,
        uploadedById: session.user.id,
        filePath: objectName,
        fileName: file.name,
        isPrimary: isFirstFile,
        label,
      });

      broadcastApplicantUpdate({ applicantId, resume: newAttachment, action: 'added' }, session.user.id);
      results.push(await addResumeUrl(newAttachment));

      if (isFirstFile) {
        isFirstFile = false;
      }
    } catch (error) {
      errors.push(`Failed to upload ${file.name}: ${String(error)}`);
    }
  }

  if (results.length === 0) {
    return NextResponse.json({
      message: 'All uploads failed',
      errors,
    }, { status: 500 });
  }

  return NextResponse.json({
    data: results,
    message: `Successfully uploaded ${results.length} file(s)`,
    errors: errors.length > 0 ? errors : undefined,
  }, { status: 201 });
}

export async function handleSetPrimaryApplicantResume(request: NextRequest, context: ApplicantResumesRouteContext) {
  const applicantId = await resolveApplicantId(context);
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const attachmentId = await parseAttachmentIdBody(request);
  if (!attachmentId) {
    return NextResponse.json({ message: 'Attachment ID is required' }, { status: 400 });
  }

  try {
    const updated = await setApplicantPrimaryResume(applicantId, attachmentId);
    broadcastApplicantUpdate({ applicantId, resume: updated, action: 'updated' }, session.user.id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Error setting primary attachment', error: String(error) }, { status: 500 });
  }
}

export async function handleDeleteApplicantResume(request: NextRequest, context: ApplicantResumesRouteContext) {
  const applicantId = await resolveApplicantId(context);
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const attachmentId = await parseAttachmentIdBody(request);
  if (!attachmentId) {
    return NextResponse.json({ message: 'Attachment ID is required' }, { status: 400 });
  }

  try {
    const applicant = await fetchApplicantForAttachmentDelete(applicantId);
    if (!applicant) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    const permissionError = getAttachmentDeletePermissionError(session.user, applicant.recruiterId);
    if (permissionError) {
      return permissionError;
    }

    const attachment = await fetchApplicantAttachment(applicantId, attachmentId);
    if (!attachment) {
      return NextResponse.json({ message: 'Attachment not found' }, { status: 404 });
    }

    await deleteApplicantResumeFile(attachment.filePath);
    await deleteApplicantAttachmentRecord(applicantId, attachmentId);
    broadcastApplicantUpdate({ applicantId, resume: { id: attachmentId }, action: 'deleted' }, session.user.id);

    if (attachment.isPrimary) {
      await promoteNewestApplicantAttachment(applicantId);
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting attachment', error: String(error) }, { status: 500 });
  }
}
