import { type NextRequest } from 'next/server';
import {
  handleCreateHeadcountAttachment,
  handleDeleteHeadcountAttachment,
  handleGetHeadcountAttachments,
} from './headcount-attachments-handlers';
import type { HeadcountAttachmentsRouteContext } from './headcount-attachments-types';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  return handleGetHeadcountAttachments(request, context);
}

export function POST(request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  return handleCreateHeadcountAttachment(request, context);
}

export function DELETE(request: NextRequest, context: HeadcountAttachmentsRouteContext) {
  return handleDeleteHeadcountAttachment(request, context);
}
