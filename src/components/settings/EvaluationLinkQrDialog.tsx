"use client";

import { Copy, Download, ExternalLink } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { sanitizeUrl } from '@/lib/utils';
import {
  formatEvaluationLinkCountdown,
  type EvalLinkQrData,
} from './evaluation-links-tab-utils';

interface EvaluationLinkQrDialogProps {
  isMobile: boolean;
  open: boolean;
  qrData: EvalLinkQrData | null;
  appLogoUrl: string | null;
  onOpenChange: (open: boolean) => void;
}

function downloadQrCode(qrData: EvalLinkQrData) {
  const canvas = document.getElementById('settings-qr-code') as HTMLCanvasElement | null;
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = safeUrl;
    downloadLink.download = `evaluation-qr-${qrData.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function EvaluationLinkQrDialogContent({
  qrData,
  appLogoUrl,
}: {
  qrData: EvalLinkQrData | null;
  appLogoUrl: string | null;
}) {
  if (!qrData) return null;

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <QRCodeCanvas
          id="settings-qr-code"
          value={qrData.url}
          size={240}
          level="H"
          imageSettings={appLogoUrl ? {
            src: appLogoUrl,
            x: undefined,
            y: undefined,
            height: 48,
            width: 48,
            excavate: true,
          } : undefined}
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">applicant</p>
        <h3 className="font-semibold text-lg">{qrData.name}</h3>
        {qrData.expiresAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Expires: {new Date(qrData.expiresAt).toLocaleDateString()} ({formatEvaluationLinkCountdown(qrData.expiresAt)})
          </p>
        )}
      </div>

      <div className="flex flex-col w-full gap-3 px-4">
        <Button className="w-full" onClick={() => downloadQrCode(qrData)}>
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const safeUrl = sanitizeUrl(qrData.url);
              if (safeUrl) {
                window.open(safeUrl, '_blank');
              } else {
                toast.error('Invalid URL');
              }
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Go to Link
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(qrData.url);
              toast.success('Link copied');
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full px-8 text-center">
        <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
          {qrData.url}
        </p>
      </div>
    </div>
  );
}

export function EvaluationLinkQrDialog({
  isMobile,
  open,
  qrData,
  appLogoUrl,
  onOpenChange,
}: EvaluationLinkQrDialogProps) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-center">Evaluation Link QR Code</SheetTitle>
          </SheetHeader>
          <EvaluationLinkQrDialogContent qrData={qrData} appLogoUrl={appLogoUrl} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Evaluation Link QR Code</DialogTitle>
        </DialogHeader>
        <EvaluationLinkQrDialogContent qrData={qrData} appLogoUrl={appLogoUrl} />
      </DialogContent>
    </Dialog>
  );
}
