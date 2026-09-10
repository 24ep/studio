export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleDeleteAttachment,
  handleListAttachments,
  handleSetPrimaryAttachment,
  handleUploadAttachment,
  handleUploadAttachmentFromUrl,
  type AttachmentRouteContext,
} from './attachments-route-handlers';

export function GET(request: NextRequest, context: AttachmentRouteContext) {
  return handleListAttachments(request, context);
}

export function POST(request: NextRequest, context: AttachmentRouteContext) {
  return handleUploadAttachment(request, context);
}

export function PATCH(request: NextRequest, context: AttachmentRouteContext) {
  return handleUploadAttachmentFromUrl(request, context);
}

export function PUT(request: NextRequest, context: AttachmentRouteContext) {
  return handleSetPrimaryAttachment(request, context);
}

export function DELETE(request: NextRequest, context: AttachmentRouteContext) {
  return handleDeleteAttachment(request, context);
}
