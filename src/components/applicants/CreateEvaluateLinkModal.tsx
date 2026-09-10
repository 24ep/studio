"use client";

import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CreateEvaluateLinkDesktopFrame,
  CreateEvaluateLinkMobileFrame,
  CreateEvaluateLinkModalContent,
} from "./CreateEvaluateLinkModalParts";
import type { CreateEvaluateLinkApplicantInfo } from "./create-evaluate-link-utils";
import { useCreateEvaluateLinkModal } from "./use-create-evaluate-link-modal";

interface CreateEvaluateLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: CreateEvaluateLinkApplicantInfo;
  onSuccess?: (linkInfo: { url: string; expiresAt: string }) => void;
  editMode?: boolean;
  initialData?: {
    interviewDateTime?: string;
    interviewLocation?: string;
    interviewers?: Array<{ id: string; name: string }>;
  };
}

export function CreateEvaluateLinkModal({
  isOpen,
  onOpenChange,
  applicant,
  onSuccess,
  editMode = false,
  initialData,
}: CreateEvaluateLinkModalProps) {
  const isMobile = useIsMobile();
  const modalLayerId = `create-evaluate-link-modal-${applicant.id}${editMode ? "-edit" : ""}`;
  const modal = useCreateEvaluateLinkModal({
    applicant,
    editMode,
    initialData,
    isOpen,
    onOpenChange,
    onSuccess,
  });

  const content = (
    <CreateEvaluateLinkModalContent
      applicant={applicant}
      modal={modal}
      onClose={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <CreateEvaluateLinkMobileFrame
          modalLayerId={modalLayerId}
          onClose={() => onOpenChange(false)}
        >
          {content}
        </CreateEvaluateLinkMobileFrame>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <CreateEvaluateLinkDesktopFrame
        modalLayerId={modalLayerId}
        onClose={() => onOpenChange(false)}
      >
        {content}
      </CreateEvaluateLinkDesktopFrame>
    </Dialog>
  );
}
