import { sanitizeUrl } from "@/lib/utils";

export interface EvaluationQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt?: string;
}

export function getEvaluationQrExpiryLabel(expiresAtValue?: string) {
  if (!expiresAtValue) {
    return null;
  }

  const expiresAt = new Date(expiresAtValue);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return {
      date: expiresAt.toLocaleDateString(),
      expired: true,
      text: "Expired",
    };
  }

  return {
    date: expiresAt.toLocaleDateString(),
    expired: false,
    text: diffDays > 1 ? `Expires in ${diffDays} days` : "Expires soon",
  };
}

export function openEvaluationQrLink(url: string, onInvalidUrl: () => void) {
  const safeUrl = sanitizeUrl(url);
  if (safeUrl) {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  } else {
    onInvalidUrl();
  }
}

export function downloadEvaluationQrCode(qrData: EvaluationQrData) {
  const canvas = document.getElementById("evaluation-qr-code-modal") as HTMLCanvasElement;
  if (!canvas) return;

  const newCanvas = document.createElement("canvas");
  const padding = 64;
  const borderWidth = 4;
  const totalSize = 240 + (padding * 2) + (borderWidth * 2);

  newCanvas.width = totalSize;
  newCanvas.height = totalSize;
  const ctx = newCanvas.getContext("2d");

  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalSize, totalSize);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, totalSize - borderWidth, totalSize - borderWidth);
  ctx.drawImage(canvas, padding + borderWidth, padding + borderWidth);

  newCanvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const safeUrl = sanitizeUrl(url);
    if (safeUrl) {
      const downloadLink = document.createElement("a");
      downloadLink.href = safeUrl;
      downloadLink.download = `evaluation-qr-${qrData.name.replace(/\s+/g, "_")}.png`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    }
  }, "image/png");
}
