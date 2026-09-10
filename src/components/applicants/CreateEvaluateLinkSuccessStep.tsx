"use client";

import {
  ArrowDownTrayIcon as Download,
  ArrowTopRightOnSquareIcon as ExternalLink,
  CheckIcon as Check,
  DocumentDuplicateIcon as Copy,
} from "@heroicons/react/24/outline";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import { sanitizeUrl } from "@/lib/utils";

interface CreateEvaluateLinkSuccessStepProps {
  applicantName: string;
  linkInfo: { url: string; expiresAt: string } | null;
  appLogoUrl: string | null;
  copied: boolean;
  onCopyLink: () => void;
  onDownloadQr: () => void;
}

export function CreateEvaluateLinkSuccessStep({
  applicantName,
  linkInfo,
  appLogoUrl,
  copied,
  onCopyLink,
  onDownloadQr,
}: CreateEvaluateLinkSuccessStepProps) {
  const nameInfo = formatApplicantNameWithLang({ name: applicantName });

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Evaluation Link Created!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          For <span className={nameInfo.fontClass} lang={nameInfo.lang}>{applicantName}</span>
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
        <QRCodeCanvas
          id="evaluate-qr-code"
          value={linkInfo?.url || ""}
          size={200}
          level="H"
          imageSettings={appLogoUrl ? {
            src: appLogoUrl,
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          } : undefined}
        />
      </div>

      {linkInfo?.expiresAt && (
        <p className="text-sm text-muted-foreground">
          Expires: {new Date(linkInfo.expiresAt).toLocaleDateString()}
        </p>
      )}

      <div className="flex flex-col w-full gap-2 px-4">
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              const safeUrl = sanitizeUrl(linkInfo?.url || "");
              if (safeUrl) {
                window.open(safeUrl, "_blank", "noopener,noreferrer");
              } else {
                toast.error("Invalid link");
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Open Link
          </Button>
          <Button variant="outline" size="icon" aria-label="Copy evaluation link" onClick={onCopyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button variant="outline" onClick={onDownloadQr}>
          <Download className="h-4 w-4 mr-2" /> Download QR Code
        </Button>
      </div>
    </div>
  );
}
