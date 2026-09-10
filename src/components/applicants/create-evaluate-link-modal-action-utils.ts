import { buildEvaluationQrDownloadFilename } from './create-evaluate-link-date-utils';

export function getCreateEvaluateLinkErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to create evaluation link";
}

export function copyCreateEvaluateLinkToClipboard(url: string, clipboard: Pick<Clipboard, 'writeText'> = navigator.clipboard) {
  return clipboard.writeText(url);
}

export function downloadCreateEvaluateLinkQrCode({
  applicantName,
  canvasId = "evaluate-qr-code",
  documentRef = document,
}: {
  applicantName: string;
  canvasId?: string;
  documentRef?: Document;
}) {
  const canvas = documentRef.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) {
    return false;
  }

  const pngUrl = canvas.toDataURL("image/png");
  const downloadLink = documentRef.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = buildEvaluationQrDownloadFilename(applicantName);
  documentRef.body.appendChild(downloadLink);
  downloadLink.click();
  documentRef.body.removeChild(downloadLink);
  return true;
}
