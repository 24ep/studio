"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import {
  CalendarQrCodeContent,
  type CalendarQrData,
} from './CalendarQrCodeContent';

interface CalendarQrCodeDialogProps {
  appLogoUrl: string | null;
  isMobile: boolean;
  open: boolean;
  qrData: CalendarQrData | null;
  onEditAppointment: () => void;
  onOpenChange: (open: boolean) => void;
}

export function CalendarQrCodeDialog({
  appLogoUrl,
  isMobile,
  open,
  qrData,
  onEditAppointment,
  onOpenChange,
}: CalendarQrCodeDialogProps) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl" hideCloseButton>
          <SheetHeader>
            <div className="relative flex items-center justify-center py-1">
              <SheetTitle className="text-center">Evaluation Link QR Code</SheetTitle>
              <SheetClose className="absolute right-0 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </SheetHeader>
          {qrData && (
            <CalendarQrCodeContent
              qrData={qrData}
              appLogoUrl={appLogoUrl}
              onEditAppointment={onEditAppointment}
            />
          )}
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
        {qrData && (
          <CalendarQrCodeContent
            qrData={qrData}
            appLogoUrl={appLogoUrl}
            onEditAppointment={onEditAppointment}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
