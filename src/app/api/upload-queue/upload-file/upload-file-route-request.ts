import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { MAX_FILES_PER_REQUEST, type UploadOptions } from './upload-file-route-types';

export interface ParsedUploadRequest extends Omit<UploadOptions, 'created_by'> {
  files: File[];
}

export async function parseUploadRequest(
  request: NextRequest,
): Promise<{ ok: true; data: ParsedUploadRequest } | { ok: false; response: NextResponse }> {
  const formData = await request.formData();
  let files = formData.getAll('files') as File[];

  if (!files.length) {
    const singleFile = formData.get('file');
    if (singleFile && typeof singleFile !== 'string') {
      files = [singleFile as File];
    }
  }

  if (!files.length) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No files provided' }, { status: 400 }),
    };
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return {
      ok: false,
      response: NextResponse.json({
        error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files per request. Got: ${files.length}`,
      }, { status: 400 }),
    };
  }

  const webhookPayload = formData.get('webhook_payload');

  return {
    ok: true,
    data: {
      files,
      position_id: formData.get('position_id') as string || undefined,
      batch_id: formData.get('batch_id') as string || uuidv4(),
      source: formData.get('source') as string || 'bulk',
      source_id: formData.get('source_id') as string || undefined,
      sub_source: formData.get('sub_source') as string || undefined,
      webhook_payload: webhookPayload ? JSON.parse(webhookPayload as string) : undefined,
    },
  };
}
