import type { AttachmentTagOption, FileWithTag } from "./upload-attachments-modal-types";
import { readJsonOrFallback } from "@/lib/response-json";

export const PREDEFINED_ATTACHMENT_TAGS: AttachmentTagOption[] = [
  { value: "resume", label: "Resume" },
  { value: "cover-letter", label: "Cover Letter" },
  { value: "certificate", label: "Certificate" },
  { value: "portfolio", label: "Portfolio" },
  { value: "reference-letter", label: "Reference Letter" },
  { value: "transcript", label: "Transcript" },
  { value: "other", label: "Other" },
];

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
]);

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function getAttachmentValidationError(file: File) {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return `${file.name} is not a supported file type`;
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return `${file.name} is too large (max 10MB)`;
  }

  return null;
}

export function formatAttachmentSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function getAttachmentIconKind(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

export async function uploadApplicantAttachment(applicantId: string, { file, tag }: FileWithTag) {
  const formData = new FormData();
  formData.append("attachments", file);
  if (tag.trim()) {
    formData.append("label", tag.trim());
  }

  const response = await fetch(`/api/applicants/${applicantId}/resumes`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}`);
  }

  return readJsonOrFallback<unknown>(response, null);
}
