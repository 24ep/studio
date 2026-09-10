"use client";

import { XMarkIcon as X } from "@heroicons/react/24/outline";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ApplicantEvaluationQrCodeContent } from "./ApplicantEvaluationQrCodeContent";
import type { EvaluationQrData } from "./applicant-evaluation-qr-code-utils";

interface ApplicantEvaluationQrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  qrData: EvaluationQrData | null;
  appLogoUrl: string | null;
  onEditInterviewDetails: () => void;
  onCopyLink: () => void;
  onInvalidUrl: () => void;
}

export function ApplicantEvaluationQrCodeModal({
  open,
  onOpenChange,
  isMobile,
  qrData,
  appLogoUrl,
  onEditInterviewDetails,
  onCopyLink,
  onInvalidUrl,
}: ApplicantEvaluationQrCodeModalProps) {
  const content = (
    <ApplicantEvaluationQrCodeContent
      qrData={qrData}
      appLogoUrl={appLogoUrl}
      onEditInterviewDetails={onEditInterviewDetails}
      onCopyLink={onCopyLink}
      onInvalidUrl={onInvalidUrl}
    />
  );

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
          {content}
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
        {content}
      </DialogContent>
    </Dialog>
  );
}
