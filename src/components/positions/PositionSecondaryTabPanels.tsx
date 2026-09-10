import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EvaluationConfigTab } from './EvaluationConfigTab';
import { HeadcountTab } from './HeadcountTab';
import { InterviewerTab } from './InterviewerTab';
import { PositionCustomFieldDisplay } from './PositionCustomFieldDisplay';
import { PositionCustomFieldEdit } from './PositionCustomFieldEdit';
import { PositionMicrosoftAdTab } from './PositionMicrosoftAdTab';
import type {
  EvaluationPanelProps,
  HeadcountPanelProps,
  InterviewerPanelProps,
  MicrosoftAdPanelProps,
} from './PositionDetailDrawerTabPanelTypes';

export function PositionHeadcountPanel({
  isMobile,
  isEditMode,
  position,
  positionId,
  filteredApplicants,
  onHeadcountChange,
  onCustomFieldChange,
}: HeadcountPanelProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full pr-4">
        <div className={cn(isMobile ? 'p-4 pb-48' : 'p-6')}>
          <HeadcountTab
            positionId={positionId!}
            applicants={filteredApplicants}
            onHeadcountChange={onHeadcountChange}
          />

          <div className="mt-6">
            {isEditMode ? (
              <PositionCustomFieldEdit
                section="headcount"
                positionId={position?.id || ''}
                customFields={position?.customFields || {}}
                onFieldChange={onCustomFieldChange}
                title="Edit Headcount"
              />
            ) : (
              <PositionCustomFieldDisplay
                section="headcount"
                positionId={position?.id || ''}
                customFields={position?.customFields || {}}
                title="Edit Headcount"
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function PositionInterviewerPanel({ isMobile, position, positionId }: InterviewerPanelProps) {
  if (positionId) {
    return (
      <div className="flex-1 overflow-hidden">
        <InterviewerTab
          positionId={positionId}
          positionTitle={position?.title || ''}
        />
      </div>
    );
  }

  return (
    <div className={cn('h-full flex items-center justify-center', isMobile ? 'p-4 pb-48' : 'p-6')}>
      <div className="text-center">
        <p className="text-muted-foreground">Position ID is missing. Please close and reopen this drawer.</p>
      </div>
    </div>
  );
}

export function PositionEvaluationPanel({ position, positionId }: EvaluationPanelProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <EvaluationConfigTab
        positionId={positionId!}
        positionTitle={position?.title || ''}
      />
    </div>
  );
}

export function PositionMicrosoftAdPanel({
  isMobile,
  position,
  adUsers,
  isLoadingAdUsers,
  adUsersError,
  onRetryAdUsers,
}: MicrosoftAdPanelProps) {
  return (
    <PositionMicrosoftAdTab
      isMobile={isMobile}
      positionTitle={position?.title || ''}
      users={adUsers}
      isLoading={isLoadingAdUsers}
      error={adUsersError}
      onRetry={onRetryAdUsers}
    />
  );
}
