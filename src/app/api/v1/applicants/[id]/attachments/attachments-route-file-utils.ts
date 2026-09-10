const ATTACHMENT_CONTENT_TYPES: Array<{ extensions: string[]; contentType: string }> = [
  { extensions: ['.pdf'], contentType: 'application/pdf' },
  { extensions: ['.jpg', '.jpeg'], contentType: 'image/jpeg' },
  { extensions: ['.png'], contentType: 'image/png' },
  { extensions: ['.gif'], contentType: 'image/gif' },
  { extensions: ['.webp'], contentType: 'image/webp' },
  { extensions: ['.bmp'], contentType: 'image/bmp' },
  { extensions: ['.svg'], contentType: 'image/svg+xml' },
  { extensions: ['.doc'], contentType: 'application/msword' },
  { extensions: ['.docx'], contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { extensions: ['.xls'], contentType: 'application/vnd.ms-excel' },
  { extensions: ['.xlsx'], contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];

export function inferAttachmentContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  return ATTACHMENT_CONTENT_TYPES.find(({ extensions }) => (
    extensions.some((extension) => lower.endsWith(extension))
  ))?.contentType ?? 'application/octet-stream';
}

export function extractAttachmentFileName(parsedUrl: URL, response: Response) {
  const lastPart = parsedUrl.pathname.split('/').pop();
  if (lastPart && lastPart.includes('.')) {
    return lastPart;
  }

  const contentDisposition = response.headers.get('content-disposition');
  const filenameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  return filenameMatch?.[1]?.replace(/['"]/g, '') || 'downloaded-file';
}
