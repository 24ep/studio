export function selectAttachmentUploadFile(formData: FormData): File | null {
  const attachment = formData.get('attachment');
  if (attachment instanceof File) {
    return attachment;
  }

  const firstAttachment = formData.getAll('attachments').find(isFile);
  if (firstAttachment) {
    return firstAttachment;
  }

  const firstValidFile = getAttachmentUploadCandidates(formData).find((file) => file.size > 0);
  return firstValidFile ?? null;
}

export function buildMissingAttachmentUploadMessage(formData: FormData) {
  const availableFields = Array.from(formData.keys());
  const allFiles = getAttachmentUploadCandidates(formData);
  const validFiles = allFiles.filter((file) => file.size > 0);

  return `No file uploaded. Available fields: ${availableFields.join(', ')}. Expected field name: "attachment" or "attachments". Found ${allFiles.length} total files, ${validFiles.length} valid files. This error typically occurs when a form field is created without an actual file.`;
}

export type AttachmentHeaderParseResult =
  | { ok: true; headers?: Record<string, string> }
  | { ok: false; message: string };

export function parseAttachmentDownloadHeaders({
  authToken,
  headers,
}: {
  authToken?: string;
  headers?: Record<string, unknown>;
}): AttachmentHeaderParseResult {
  if (headers) {
    return parseExplicitAttachmentDownloadHeaders(headers);
  }

  if (!authToken) {
    return { ok: true };
  }

  return {
    ok: true,
    headers: {
      Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
    },
  };
}

function parseExplicitAttachmentDownloadHeaders(headers: Record<string, unknown>): AttachmentHeaderParseResult {
  const downloadHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== 'string') {
      return {
        ok: false,
        message: `Header "${key}" must be a string value. Received ${typeof value}. If you're passing an Authorization token, make sure it's quoted: "Authorization": "Bearer <token>"`,
      };
    }
    downloadHeaders[key] = value;
  }

  return { ok: true, headers: downloadHeaders };
}

function getAttachmentUploadCandidates(formData: FormData) {
  return formData.getAll('attachment')
    .concat(formData.getAll('attachments'))
    .filter(isFile);
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File;
}
