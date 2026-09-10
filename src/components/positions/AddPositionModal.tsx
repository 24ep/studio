"use client";

import type { FormEvent } from 'react';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import {
  AddPositionBasicInfoSection,
  AddPositionCriteriaSection,
  AddPositionDescriptionSection,
  AddPositionEquipmentSection,
} from './AddPositionModalSections';
import { AddPositionReplaceDescriptionDialog } from './AddPositionReplaceDescriptionDialog';
import type { AddPositionFormValues } from './add-position-form';
import {
  type AddPositionStep,
  useAddPositionModalController,
} from './use-add-position-modal-controller';

export type { AddPositionFormValues } from './add-position-form';

interface AddPositionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPosition: (data: AddPositionFormValues) => Promise<void>;
}

const ADD_POSITION_STEPS: Array<{ id: AddPositionStep; label: string; description: string }> = [
  { id: 'basic', label: 'Basic Information', description: 'Tell us the essentials about this role.' },
  { id: 'description', label: 'Job Description', description: 'Add responsibilities, requirements, and more.' },
  { id: 'criteria', label: 'Match Criteria', description: 'Define must-haves and nice-to-haves.' },
  { id: 'equipment', label: 'Equipment & Onboarding', description: 'Prepare client and day-one equipment.' },
];

export function AddPositionModal({
  isOpen,
  onAddPosition,
  onOpenChange,
}: AddPositionModalProps) {
  const controller = useAddPositionModalController({ isOpen, onAddPosition });
  const currentStepIndex = ADD_POSITION_STEPS.findIndex(
    (step) => step.id === controller.currentStep,
  );
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (controller.currentStep !== 'equipment') {
      event.preventDefault();
      void controller.nextStep();
      return;
    }

    void controller.form.handleSubmit(controller.onSubmit)(event);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(88vh,830px)] min-h-[620px] w-[min(94vw,1060px)] max-w-[1060px] flex-col overflow-hidden p-0" dialogId="add-position-modal" hideCloseButton>
          <DialogHeader className="relative flex-shrink-0 border-b px-7 pb-5 pr-16 pt-6">
            <DialogTitle className="text-xl">Add New Position</DialogTitle>
            <DialogDescription>Create a new role and define where it fits in your organization.</DialogDescription>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-5 top-5 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Close Add New Position"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex min-h-0 flex-1">
              <AddPositionStepRail
                currentStep={controller.currentStep}
                currentStepIndex={currentStepIndex}
              />

              <ScrollArea className="min-w-0 flex-1 px-6 py-5 overflow-auto sm:px-7">
                <div className="pb-2">
                {controller.currentStep === 'basic' && (
                <AddPositionBasicInfoSection
                  availableRecruiter={controller.availableRecruiter}
                  form={controller.form}
                  grades={controller.grades}
                  isLoadingLevels={controller.isLoadingLevels}
                  isSaving={controller.isSaving}
                  positionLevels={controller.positionLevels}
                  organizationUnits={controller.organizationUnits}
                />
                )}

                {controller.currentStep === 'description' && (
                <AddPositionDescriptionSection
                  canGenerateDescription={controller.canGenerateDescription}
                  form={controller.form}
                  isGeneratingDescription={controller.isGeneratingDescription}
                  isModalReady={controller.isModalReady}
                  onGenerateJobDescription={controller.generateJobDescription}
                />
                )}

                {controller.currentStep === 'criteria' && (
                <AddPositionCriteriaSection
                  defaultMatchCriteria={controller.defaultMatchCriteria}
                  form={controller.form}
                  isLoadingDefaultCriteria={controller.isLoadingDefaultCriteria}
                  isModalReady={controller.isModalReady}
                />
                )}

                {controller.currentStep === 'equipment' && (
                <AddPositionEquipmentSection
                  form={controller.form}
                  isSaving={controller.isSaving}
                />
                )}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="flex-shrink-0 border-t px-7 py-3.5">
              <div className="flex w-full items-center justify-between gap-3">
                {controller.currentStep === 'basic' ? (
                  <button type="button" onClick={controller.saveDraft} className="text-left text-sm font-semibold text-primary hover:underline">
                    <span className="block">Save draft</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">You can continue later</span>
                  </button>
                ) : (
                  <Button type="button" variant="outline" onClick={controller.previousStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}

                {controller.currentStep === 'equipment' ? (
                  <Button type="submit" disabled={controller.form.formState.isSubmitting}>
                    {controller.form.formState.isSubmitting ? 'Adding Position...' : 'Add Position'}
                  </Button>
                ) : (
                  <div className="flex flex-col items-end">
                    <Button type="submit" className="min-w-32">
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    <span className="mt-1 text-[11px] text-muted-foreground">Next: {ADD_POSITION_STEPS[currentStepIndex + 1].label}</span>
                  </div>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddPositionReplaceDescriptionDialog
        onConfirm={controller.handleConfirmReplace}
        onOpenChange={controller.setShowReplaceConfirmation}
        open={controller.showReplaceConfirmation}
      />
    </>
  );
}

function AddPositionStepRail({
  currentStep,
  currentStepIndex,
}: {
  currentStep: AddPositionStep;
  currentStepIndex: number;
}) {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r bg-muted/10 px-6 py-6 md:flex" aria-label="Position creation progress">
      <ol className="relative">
        {ADD_POSITION_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className={cn('relative', index < ADD_POSITION_STEPS.length - 1 && 'pb-11')}>
              {index < ADD_POSITION_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-0 left-[15px] top-8 w-px',
                    index < currentStepIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
              <div
                className={cn(
                  'flex items-start gap-3 text-sm font-medium',
                  isCurrent || isComplete ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isComplete && 'border-primary bg-primary/10 text-primary',
                    !isCurrent && !isComplete && 'border-border bg-background',
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="pt-0.5">
                  <span className="block whitespace-nowrap">{step.label}</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{step.description}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4" />
        All changes are autosaved
      </div>
    </aside>
  );
}
