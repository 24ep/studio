"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon as CheckCircle,
  ArrowTopRightOnSquareIcon as ExternalLink,
} from '@heroicons/react/24/outline';
import type { ApplicantEvaluationLinkInfo } from './applicant-evaluation-modal-api';

interface LinkCreatedModalProps {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requireLogin: boolean;
  linkInfo: ApplicantEvaluationLinkInfo | null;
  onCopyLink: () => void;
  onOpenLink: () => void;
}

export function LinkCreatedModal({
  isMobile,
  open,
  onOpenChange,
  requireLogin,
  linkInfo,
  onCopyLink,
  onOpenLink,
}: LinkCreatedModalProps) {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-[20px]">
          <DrawerHeader>
            <DrawerTitle>Evaluation link created</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 py-8 space-y-4">
            <LinkCreatedContent
              requireLogin={requireLogin}
              linkInfo={linkInfo}
              onCopyLink={onCopyLink}
              onOpenLink={onOpenLink}
              onClose={() => onOpenChange(false)}
              compactActions
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>Evaluation link created</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <LinkCreatedContent
            requireLogin={requireLogin}
            linkInfo={linkInfo}
            onCopyLink={onCopyLink}
            onOpenLink={onOpenLink}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkCreatedContent({
  requireLogin,
  linkInfo,
  onCopyLink,
  onOpenLink,
  onClose,
  compactActions = false,
}: {
  requireLogin: boolean;
  linkInfo: ApplicantEvaluationLinkInfo | null;
  onCopyLink: () => void;
  onOpenLink: () => void;
  onClose?: () => void;
  compactActions?: boolean;
}) {
  return (
    <>
      <div className="text-sm text-muted-foreground">
        Share this link to evaluate the Applicant. {requireLogin ? 'Login required.' : 'No login required.'}
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={linkInfo?.url || ''}
          className={`flex-1 border rounded px-2 py-2 text-sm ${compactActions ? 'bg-muted' : ''}`}
        />
        <Button
          variant="outline"
          size={compactActions ? 'icon' : undefined}
          onClick={onCopyLink}
        >
          {compactActions ? <CheckCircle className="h-4 w-4" /> : 'Copy'}
        </Button>
        <Button size={compactActions ? 'icon' : undefined} onClick={onOpenLink}>
          {compactActions ? <ExternalLink className="h-4 w-4" /> : 'Open'}
        </Button>
      </div>
      {linkInfo?.expiresAt && (
        <div className="text-xs text-muted-foreground">Expires at: {new Date(linkInfo.expiresAt).toLocaleString()}</div>
      )}
      {onClose && (
        <Button className="w-full mt-4" variant="outline" onClick={onClose}>Close</Button>
      )}
    </>
  );
}
