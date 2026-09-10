import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { buildServerFileUrl } from '@/lib/fileUrls';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  buildWordAttachmentContent,
  buildWordAttachmentNames,
  canAttemptSaveWordAttachment,
  getSaveWordAttachmentPermissionFlags,
  getSaveWordOwnershipFailure,
  parseSaveWordToAttachmentBody,
  uploadWordAttachmentObject,
} from './save-word-to-attachment-helpers';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissionFlags = getSaveWordAttachmentPermissionFlags(session.user);
  
  if (!canAttemptSaveWordAttachment(permissionFlags)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage Applicant attachments' }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const body = bodyResult.ok ? parseSaveWordToAttachmentBody(bodyResult.value) : null;

    if (!body) {
      return NextResponse.json({ error: 'Missing required fields: applicantId and content' }, { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: body.applicantId },
      select: { id: true, name: true, recruiterId: true }
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }
    
    const ownershipFailure = getSaveWordOwnershipFailure({
      applicantRecruiterId: applicant.recruiterId,
      hasGlobalEditPermission: permissionFlags.hasGlobalEditPermission,
      user: session.user,
    });
    if (ownershipFailure) {
      return NextResponse.json({ error: `Forbidden: ${ownershipFailure}` }, { status: 403 });
    }

    const { finalFileName, objectName } = buildWordAttachmentNames({
      applicantId: body.applicantId,
      fileName: body.fileName,
      promptName: body.promptName,
    });
    const wordContent = buildWordAttachmentContent({
      content: body.content,
      title: body.fileName || 'Generated Content',
    });
    await uploadWordAttachmentObject({ objectName, wordContent });

    const count = await prisma.attachment.count({ where: { applicantId: body.applicantId } });
    const isPrimary = count === 0;

    const newAttachment = await prisma.attachment.create({
      data: {
        applicantId: body.applicantId,
        uploadedById: session.user.id,
        filePath: objectName,
        fileName: finalFileName,
        isPrimary,
        label: 'ai-generated',
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newAttachment,
        url: await buildServerFileUrl(objectName, { strategy: 'stream' })
      },
      message: 'Word document saved to Applicant attachments successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving Word document to attachment:', error);
    return NextResponse.json({ 
      error: 'Failed to save Word document to attachment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

