import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import type { ApplicantResumesRouteContext, ResumePagination } from './applicant-resumes-types';

const uuidSchema = z.string().uuid();

export async function resolveApplicantId(context: ApplicantResumesRouteContext) {
  const { id } = await context.params;
  return id;
}

export function isValidApplicantId(id: string) {
  return uuidSchema.safeParse(id).success;
}

export function parseResumePagination(request: NextRequest): ResumePagination {
  const { searchParams } = new URL(request.url);

  return {
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    offset: parseInt(searchParams.get('offset') || '0'),
  };
}

export async function parseResumeUploadForm(request: NextRequest) {
  const formData = await request.formData();

  return {
    files: formData.getAll('attachments'),
    label: (formData.get('label') as string) || 'resume',
  };
}

export async function parseAttachmentIdBody(request: NextRequest) {
  const body = await readRequestJsonObject(request);
  return getJsonString(body, 'attachmentId');
}
