"use client";

import type { ReactNode } from "react";
import { XMarkIcon as X } from "@heroicons/react/24/outline";

import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface CreateEvaluateLinkModalFrameProps {
  children: ReactNode;
  modalLayerId: string;
  onClose: () => void;
}

export function CreateEvaluateLinkMobileFrame({
  children,
  modalLayerId,
  onClose,
}: CreateEvaluateLinkModalFrameProps) {
  return (
    <SheetContent
      side="bottom"
      sheetId={modalLayerId}
      className="max-h-[90vh] overflow-y-auto rounded-t-3xl"
      hideCloseButton
    >
      <SheetHeader className="relative">
        <SheetTitle>Create Evaluate Link</SheetTitle>
        <CloseButton onClose={onClose} className="absolute right-0 top-0" />
      </SheetHeader>
      {children}
    </SheetContent>
  );
}

export function CreateEvaluateLinkDesktopFrame({
  children,
  modalLayerId,
  onClose,
}: CreateEvaluateLinkModalFrameProps) {
  return (
    <DialogContent
      dialogId={modalLayerId}
      className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      hideCloseButton
    >
      <DialogHeader className="relative">
        <DialogTitle>Create Evaluate Link</DialogTitle>
        <CloseButton onClose={onClose} className="absolute right-4 top-0" />
      </DialogHeader>
      {children}
    </DialogContent>
  );
}

function CloseButton({ className, onClose }: { className?: string; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`${className || ""} rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
