import { sanitizeUrl } from "@/lib/security";

import { createWebhookExportFilename } from "./webhook-management-controller-utils";

export function downloadWebhookExportBlob(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const safeUrl = sanitizeUrl(url);

  if (!safeUrl) {
    window.URL.revokeObjectURL(url);
    return false;
  }

  const anchor = document.createElement("a");
  anchor.href = safeUrl;
  anchor.download = createWebhookExportFilename();
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
  return true;
}
