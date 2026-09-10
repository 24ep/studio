export interface ApplicantAttachment {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  url: string;
  updatedAt?: string;
  isPrimary?: boolean;
  label?: string;
  fileSize?: number;
  applicantId?: string;
  filename?: string;
  name?: string;
  originalName?: string;
  uploadedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface ApplicantFilePreview {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
  filePath?: string;
  applicantId?: string;
}

export function getApplicantAttachmentDisplayName(attachment: Pick<ApplicantAttachment, "fileName" | "filename" | "name" | "originalName">) {
  return attachment.fileName ||
    attachment.filename ||
    attachment.name ||
    attachment.originalName ||
    "Unknown";
}

export function getApplicantAttachmentUpdatedAt(attachment: Pick<ApplicantAttachment, "updatedAt" | "uploadedAt">) {
  return attachment.updatedAt || attachment.uploadedAt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasStringId(value: unknown): value is Record<string, unknown> & { id: string } {
  return isRecord(value) && typeof value.id === "string";
}

function getRecordString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" ? field : undefined;
}

function getRecordBoolean(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "boolean" ? field : undefined;
}

function getRecordNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "number" ? field : undefined;
}

function normalizeListResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.data)) return value.data;
  return [];
}

function normalizeUploadedBy(value: unknown): ApplicantAttachment["uploadedBy"] {
  if (!isRecord(value)) return undefined;

  const id = getRecordString(value, "id");
  if (!id) return undefined;

  return {
    id,
    name: getRecordString(value, "name") ?? null,
    email: getRecordString(value, "email") ?? null,
  };
}

export function normalizeApplicantAttachments(value: unknown): ApplicantAttachment[] {
  return normalizeListResponse(value)
    .filter(hasStringId)
    .map((attachment) => {
      const fileName = getRecordString(attachment, "fileName") ??
        getRecordString(attachment, "filename") ??
        getRecordString(attachment, "name") ??
        getRecordString(attachment, "originalName") ??
        "Unknown";
      const uploadedAt = getRecordString(attachment, "uploadedAt") ??
        getRecordString(attachment, "updatedAt") ??
        "";

      return {
        id: attachment.id,
        fileName,
        filePath: getRecordString(attachment, "filePath") ?? "",
        uploadedAt,
        url: getRecordString(attachment, "url") ?? "",
        updatedAt: getRecordString(attachment, "updatedAt") ?? uploadedAt,
        isPrimary: getRecordBoolean(attachment, "isPrimary"),
        label: getRecordString(attachment, "label"),
        fileSize: getRecordNumber(attachment, "fileSize"),
        applicantId: getRecordString(attachment, "applicantId"),
        filename: getRecordString(attachment, "filename"),
        name: getRecordString(attachment, "name"),
        originalName: getRecordString(attachment, "originalName"),
        uploadedBy: normalizeUploadedBy(attachment.uploadedBy),
      };
    });
}
