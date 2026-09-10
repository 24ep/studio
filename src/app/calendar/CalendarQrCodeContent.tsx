"use client";

import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download, Edit, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { cn, sanitizeUrl } from '@/lib/utils';

export interface CalendarQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt?: string;
}

function getExpirationText(expiresAtValue?: string) {
  if (!expiresAtValue) {
    return null;
  }

  const expiresAt = new Date(expiresAtValue);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true, date: expiresAt.toLocaleDateString() };
  }

  if (diffDays > 1) {
    return { text: `Expires in ${diffDays} days`, isExpired: false, date: expiresAt.toLocaleDateString() };
  }

  if (diffHours > 1) {
    return { text: `Expires in ${diffHours} hours`, isExpired: false, date: expiresAt.toLocaleDateString() };
  }

  return { text: 'Expires soon', isExpired: false, date: expiresAt.toLocaleDateString() };
}

function downloadQrCode(name: string) {
  const canvas = document.getElementById('evaluation-qr-code') as HTMLCanvasElement | null;
  if (!canvas) {
    return;
  }

  const newCanvas = document.createElement('canvas');
  const padding = 64;
  const borderWidth = 4;
  const totalSize = 240 + (padding * 2) + (borderWidth * 2);

  newCanvas.width = totalSize;
  newCanvas.height = totalSize;
  const ctx = newCanvas.getContext('2d');

  if (!ctx) {
    return;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalSize, totalSize);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, totalSize - borderWidth, totalSize - borderWidth);
  ctx.drawImage(canvas, padding + borderWidth, padding + borderWidth);

  newCanvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const safeUrl = sanitizeUrl(url);
    if (safeUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = safeUrl;
      downloadLink.download = `evaluation-qr-${name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }
  }, 'image/png');
}

interface CalendarQrCodeContentProps {
  qrData: CalendarQrData;
  appLogoUrl: string | null;
  onEditAppointment: () => void;
}

export function CalendarQrCodeContent({
  qrData,
  appLogoUrl,
  onEditAppointment,
}: CalendarQrCodeContentProps) {
  const expiration = getExpirationText(qrData.expiresAt);

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
        <div className="overflow-hidden rounded-2xl">
          <QRCodeCanvas
            id="evaluation-qr-code"
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
              display: 'block',
              borderRadius: '12px',
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Applicant</p>
        <h3 className="font-semibold text-lg">{qrData.name}</h3>
        {expiration && (
          <p className={cn('text-xs mt-1', expiration.isExpired ? 'text-destructive' : 'text-muted-foreground')}>
            {expiration.text} ({expiration.date})
          </p>
        )}
      </div>

      <div className="flex flex-col w-full gap-3 px-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => downloadQrCode(qrData.name)}
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={onEditAppointment}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Appointment
        </Button>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              window.location.href = qrData.url;
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
    </div>
  );
}
