import { ChevronRightIcon as ChevronRight } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type SendInterviewInvitationStep = 'select-interviewers' | 'edit-email' | 'preview-email';

interface SendInterviewInvitationStepIndicatorProps {
  currentStep: SendInterviewInvitationStep;
}

const stepClassName = 'flex items-center gap-2';
const circleClassName = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';

export function SendInterviewInvitationStepIndicator({
  currentStep,
}: SendInterviewInvitationStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className={cn(stepClassName, currentStep === 'select-interviewers' ? 'text-primary' : 'text-muted-foreground')}>
        <div className={cn(circleClassName, currentStep === 'select-interviewers' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          1
        </div>
        <span className="text-sm font-medium">Interview Details</span>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      <div className={cn(stepClassName, currentStep === 'edit-email' ? 'text-primary' : 'text-muted-foreground')}>
        <div className={cn(
          circleClassName,
          currentStep === 'edit-email' || currentStep === 'preview-email'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}>
          2
        </div>
        <span className="text-sm font-medium">Edit Email</span>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />

      <div className={cn(stepClassName, currentStep === 'preview-email' ? 'text-primary' : 'text-muted-foreground')}>
        <div className={cn(circleClassName, currentStep === 'preview-email' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          3
        </div>
        <span className="text-sm font-medium">Preview & Send</span>
      </div>
    </div>
  );
}
