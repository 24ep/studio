"use client";

import {
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  EnvelopeIcon as Mail,
  QrCodeIcon as QrCode,
  ArrowPathIcon as Loader2,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import type { CreateEvaluateLinkStep } from "./create-evaluate-link-utils";

interface CreateEvaluateLinkFooterProps {
  currentStep: CreateEvaluateLinkStep;
  loading: boolean;
  positionValidationLoading: boolean;
  canProceed: boolean;
  invitationEnabled: boolean;
  sendEmail: boolean;
  selectedInterviewerCount: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function CreateEvaluateLinkFooter({
  currentStep,
  loading,
  positionValidationLoading,
  canProceed,
  invitationEnabled,
  sendEmail,
  selectedInterviewerCount,
  onClose,
  onBack,
  onNext,
}: CreateEvaluateLinkFooterProps) {
  if (currentStep === "success") {
    return (
      <Button type="button" variant="outline" onClick={onClose} className="w-full">
        Close
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {currentStep === "email" && (
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={loading || positionValidationLoading || !canProceed || (invitationEnabled && sendEmail && selectedInterviewerCount === 0)}
        className="flex-1"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</>
        ) : currentStep === "email" ? (
          <><Mail className="h-4 w-4 mr-2" /> Send & Create</>
        ) : invitationEnabled && sendEmail ? (
          <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
        ) : (
          <><QrCode className="h-4 w-4 mr-2" /> Create Link</>
        )}
      </Button>
    </div>
  );
}
