import { ArrowPathIcon as Loader2, ChevronRightIcon as ChevronRight, ChevronLeftIcon as ChevronLeft } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import type { SendInterviewInvitationStep } from './SendInterviewInvitationStepIndicator';

interface SendInterviewInvitationFooterProps {
  currentStep: SendInterviewInvitationStep;
  loading: boolean;
  loadingInterviewers: boolean;
  hasInterviewDate: boolean;
  hasPosition: boolean;
  selectedInterviewerCount: number;
  emailSubject: string;
  emailBody: string;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function SendInterviewInvitationFooter({
  currentStep,
  loading,
  loadingInterviewers,
  hasInterviewDate,
  hasPosition,
  selectedInterviewerCount,
  emailSubject,
  emailBody,
  onBack,
  onClose,
  onNext,
  onSubmit,
}: SendInterviewInvitationFooterProps) {
  const isBeforePreview = currentStep === 'select-interviewers' || currentStep === 'edit-email';
  const isNextDisabled = loadingInterviewers
    || (currentStep === 'select-interviewers' && (!hasInterviewDate || selectedInterviewerCount === 0 || !hasPosition))
    || (currentStep === 'edit-email' && (!emailSubject.trim() || !emailBody.trim()));

  return (
    <div className="flex justify-between gap-2 pt-4 border-t">
      {isBeforePreview && currentStep !== 'select-interviewers' ? (
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      ) : currentStep === 'preview-email' ? (
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      ) : <span />}

      {currentStep === 'preview-email' ? (
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Invitations'
          )}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={isNextDisabled}>
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
