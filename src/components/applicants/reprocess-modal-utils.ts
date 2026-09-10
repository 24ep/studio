import type { Position } from "@/lib/types";
import { sanitizeUrl } from "@/lib/utils";
import type { ApplicantAttachment } from "./applicant-attachment-utils";

export type ReprocessAttachment = ApplicantAttachment;

export function isPdfAttachment(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function getValidReprocessAttachments(attachments: ReprocessAttachment[]) {
  return attachments.filter((attachment) => (
    attachment.id && attachment.fileName && attachment.filePath
  ));
}

export function formatAttachmentDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
}

export function getAttachmentPreviewUrl(attachment: ReprocessAttachment) {
  const previewUrl = attachment.url.includes("/api/secure-file/stream")
    ? attachment.url.replace("/api/secure-file/stream", "/api/secure-file/preview")
    : attachment.url;

  return sanitizeUrl(previewUrl);
}

export function downloadAttachment(attachment: ReprocessAttachment) {
  const safeUrl = sanitizeUrl(attachment.url);
  if (!safeUrl) {
    return;
  }

  const link = document.createElement("a");
  link.href = safeUrl;
  link.download = attachment.fileName;
  link.click();
}

export function filterReprocessPositions(positions: Position[], searchTerm: string) {
  if (!searchTerm) {
    return positions;
  }

  const normalizedSearch = searchTerm.toLowerCase();
  return positions.filter((position) => (
    position.title.toLowerCase().includes(normalizedSearch) ||
    Boolean(position.department?.toLowerCase().includes(normalizedSearch))
  ));
}
