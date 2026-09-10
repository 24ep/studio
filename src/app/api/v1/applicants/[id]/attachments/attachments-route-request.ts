import { type NextRequest } from 'next/server';
import {
  SimpleErrorHandler,
  createValidationError,
} from '@/lib/errors';
import { getJsonObject, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import {
  buildMissingAttachmentUploadMessage,
  isValidAttachmentFileUrl,
  parseAttachmentDownloadHeaders,
  selectAttachmentUploadFile,
} from './attachments-route-pure-utils';

export function routeMismatchResponse(request: NextRequest) {
  if (!request.nextUrl.pathname.includes('/job-matches')) {
    return null;
  }

  return new Response(JSON.stringify({ error: 'Route mismatch - this should be handled by job-matches route' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function readAttachmentMultipartFile(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError('Invalid content type: Expected multipart/form-data')
      ),
    };
  }

  const formData = await request.formData();
  const file = selectAttachmentUploadFile(formData);

  if (!file) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError(`Invalid input - attachment: ${buildMissingAttachmentUploadMessage(formData)}`)
      ),
    };
  }

  if (file.size === 0) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError('Invalid input - attachment: File is empty (0 bytes)')
      ),
    };
  }

  if (!file.name || file.name.trim() === '') {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError('Invalid input - attachment: File has no name')
      ),
    };
  }

  return {
    ok: true as const,
    file,
    label: (formData.get('label') as string) || 'resume',
  };
}

export async function readUrlAttachmentUploadBody(request: NextRequest) {
  try {
    const body = await readRequestJsonObject(request);
    const fileUrl = getJsonString(body, 'fileUrl');
    const label = getJsonString(body, 'label') || 'resume';
    const headers = getJsonObject(body, 'headers');
    const authToken = getJsonString(body, 'authToken');
    const parsedHeaders = parseAttachmentDownloadHeaders({ headers, authToken });
    if (!parsedHeaders.ok) {
      return {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(
          request,
          createValidationError(`Invalid input - headers: ${parsedHeaders.message}`)
        ),
      };
    }

    if (!fileUrl) {
      return {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(
          request,
          createValidationError('Invalid input - fileUrl: Missing fileUrl')
        ),
      };
    }

    if (!isValidAttachmentFileUrl(fileUrl)) {
      return {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(
          request,
          createValidationError('Invalid input - fileUrl: Invalid URL format')
        ),
      };
    }

    return { ok: true as const, fileUrl, label, downloadHeaders: parsedHeaders.headers };
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('JSON'))) {
      return {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(
          request,
          createValidationError(`Invalid input: Invalid JSON body. ${error instanceof Error ? error.message : 'JSON parsing failed'}. Make sure all string values in the JSON are properly quoted, especially in the "headers" object (e.g., "Authorization": "Bearer <token>" not "Authorization": Bearer <token>).`)
        ),
      };
    }

    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError(`Invalid input: Invalid JSON body. ${error instanceof Error ? error.message : 'Unknown error'}`)
      ),
    };
  }
}

export async function readAttachmentIdBody(request: NextRequest) {
  try {
    const body = await readRequestJsonObject(request);
    const attachmentId = getJsonString(body, 'attachmentId');
    if (!attachmentId) {
      return {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(
          request,
          createValidationError('Invalid input - attachmentId: Missing attachmentId')
        ),
      };
    }

    return { ok: true as const, attachmentId: String(attachmentId) };
  } catch {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createValidationError('Invalid input: Invalid JSON body')
      ),
    };
  }
}
