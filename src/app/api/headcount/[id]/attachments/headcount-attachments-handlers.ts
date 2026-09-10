import { NextResponse, type NextRequest } from 'next/server';
import { requireHeadcountDetailSession } from '../headcount-detail-auth';
import {
  deleteHeadcountAttachmentRecord,
  fetchHeadcount,
  fetchHeadcountAttachment,
  fetchHeadcountAttachments,
} from './headcount-attachments-data';
import {
  createHeadcountAttachmentRecordResponse,
  ensureHeadcountAttachmentStorageReady,
  uploadHeadcountAttachmentFile,
} from './headcount-attachments-create';
import {
  parseHeadcountAttachmentDeleteQuery,
  parseHeadcountAttachmentUpload,
  resolveHeadcountAttachmentParams,
} from './headcount-attachments-request';
import {
  createHeadcountAttachmentObjectName,
  removeHeadcountAttachmentObject,
} from './headcount-attachments-storage';
import type { HeadcountAttachmentsRouteContext } from './headcount-attachments-types';

export async function handleGetHeadcountAttachments(_request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  try {
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const { headcountId } = await resolveHeadcountAttachmentParams(context);
    return NextResponse.json(await fetchHeadcountAttachments(headcountId));
  } catch (error) {
    console.error('Error fetching headcount attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function handleCreateHeadcountAttachment(request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  try {
    const { headcountId } = await resolveHeadcountAttachmentParams(context);
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const headcount = await fetchHeadcount(headcountId);
    if (!headcount) {
      return NextResponse.json({ error: 'Headcount not found' }, { status: 404 });
    }

    const parsedUpload = await parseHeadcountAttachmentUpload(request);
    if (!parsedUpload.ok) {
      return parsedUpload.response;
    }

    const storageReady = await ensureHeadcountAttachmentStorageReady();
    if (!storageReady.ok) {
      return storageReady.response;
    }

    const objectName = createHeadcountAttachmentObjectName(headcountId, parsedUpload.file.name);
    const uploaded = await uploadHeadcountAttachmentFile({
      headcountId,
      userId: session.session.user.id,
      file: parsedUpload.file,
      objectName,
    });
    if (!uploaded.ok) {
      return uploaded.response;
    }

    return await createHeadcountAttachmentRecordResponse({
      headcountId,
      userId: session.session.user.id,
      file: parsedUpload.file,
      label: parsedUpload.label,
      objectName,
    });
  } catch (error) {
    console.error('[HEADCOUNT ATTACHMENT] Unexpected error:', error);
    console.error('[HEADCOUNT ATTACHMENT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function handleDeleteHeadcountAttachment(request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  try {
    const session = await requireHeadcountDetailSession();
    if (!session.ok) {
      return session.response;
    }

    const { headcountId } = await resolveHeadcountAttachmentParams(context);
    const parsedQuery = parseHeadcountAttachmentDeleteQuery(request);
    if (!parsedQuery.ok) {
      return parsedQuery.response;
    }

    const attachment = await fetchHeadcountAttachment(headcountId, parsedQuery.attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    try {
      await removeHeadcountAttachmentObject(attachment.filePath);
    } catch (minioError) {
      console.error('Error deleting file from MinIO:', minioError);
    }

    await deleteHeadcountAttachmentRecord(parsedQuery.attachmentId);
    return NextResponse.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting headcount attachment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
