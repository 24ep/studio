"use client";

import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowDownTrayIcon as Download,
  ArrowTopRightOnSquareIcon as ExternalLink,
  ClipboardDocumentIcon as Copy,
  PencilSquareIcon as Edit,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  downloadEvaluationQrCode,
  getEvaluationQrExpiryLabel,
  openEvaluationQrLink,
  type EvaluationQrData,
} from "./applicant-evaluation-qr-code-utils";

interface ApplicantEvaluationQrCodeContentProps {
  appLogoUrl: string | null;
  qrData: EvaluationQrData | null;
  onCopyLink: () => void;
  onEditInterviewDetails: () => void;
  onInvalidUrl: () => void;
}

export function ApplicantEvaluationQrCodeContent({
  appLogoUrl,
  qrData,
  onCopyLink,
  onEditInterviewDetails,
  onInvalidUrl,
}: ApplicantEvaluationQrCodeContentProps) {
  if (!qrData) return null;

  const expiryLabel = getEvaluationQrExpiryLabel(qrData.expiresAt);

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
        <div className="overflow-hidden rounded-2xl">
          <QRCodeCanvas
            id="evaluation-qr-code-modal"
            value={qrData.url}
            size={240}
            level="H"
            imageSettings={appLogoUrl ? {
              src: appLogoUrl,
              x: undefined,
              y: undefined,
              height: 44,
              width: 44,
              excavate: true,
            } : undefined}
            style={{
              display: "block",
              borderRadius: "12px",
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Applicant</p>
        <h3 className="font-semibold text-lg">{qrData.name}</h3>
        {expiryLabel && (
          <p className={cn("text-xs mt-1", expiryLabel.expired ? "text-destructive" : "text-muted-foreground")}>
            {expiryLabel.text} ({expiryLabel.date})
          </p>
        )}
      </div>

      <div className="flex flex-col w-full gap-3 px-4">
        <Button variant="outline" className="w-full" onClick={() => downloadEvaluationQrCode(qrData)}>
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>

        <Button variant="outline" className="w-full" onClick={onEditInterviewDetails}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Interview Details
        </Button>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => openEvaluationQrLink(qrData.url, onInvalidUrl)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Go to Link
          </Button>
          <Button variant="outline" size="icon" onClick={onCopyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
