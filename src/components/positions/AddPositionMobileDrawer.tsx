"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { AddPositionFormValues } from "./add-position-form";
import {
  AddPositionMobileFooter,
  AddPositionMobileHeader,
  AddPositionMobileProgress,
  AddPositionReplaceDescriptionDialog,
} from "./AddPositionMobileDrawerParts";
import {
  AddPositionMobileBasicStep,
  AddPositionMobileCriteriaStep,
  AddPositionMobileDescriptionStep,
} from "./AddPositionMobileDrawerSteps";
import type { AddPositionMobileDrawerProps } from "./AddPositionMobileDrawerTypes";
import { useAddPositionMobileDrawer } from "./use-add-position-mobile-drawer";

export type { AddPositionFormValues } from "./add-position-form";

export function AddPositionMobileDrawer(props: AddPositionMobileDrawerProps) {
  const { isOpen, onOpenChange } = props;
  const state = useAddPositionMobileDrawer(props);

  if (!isOpen) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] p-0 flex flex-col rounded-t-3xl"
          sheetId="add-position-mobile-drawer"
        >
          <AddPositionMobileHeader
            stepNumber={state.stepNumber}
            stepTitle={state.stepTitle}
          />
          <AddPositionMobileProgress currentStep={state.currentStep} />
          <ScrollArea className="flex-1 px-4 py-4">
            <form className="space-y-4">
              {state.currentStep === "basic" && (
                <AddPositionMobileBasicStep
                  availableRecruiter={state.availableRecruiter}
                  form={state.form}
                  grades={state.grades}
                  isLoadingLevels={state.isLoadingLevels}
                  isSaving={state.isSaving}
                  positionLevels={state.positionLevels}
                  organizationUnits={state.organizationUnits}
                />
              )}
              {state.currentStep === "description" && (
                <AddPositionMobileDescriptionStep
                  canGenerateDescription={state.canGenerateDescription}
                  form={state.form}
                  isGeneratingDescription={state.isGeneratingDescription}
                  isModalReady={state.isModalReady}
                  onGenerateJobDescription={state.actions.generateJobDescription}
                />
              )}
              {state.currentStep === "criteria" && (
                <AddPositionMobileCriteriaStep
                  defaultMatchCriteria={state.defaultMatchCriteria}
                  form={state.form}
                  isLoadingDefaultCriteria={state.isLoadingDefaultCriteria}
                  isModalReady={state.isModalReady}
                />
              )}
            </form>
          </ScrollArea>
          <AddPositionMobileFooter
            actions={state.actions}
            canProceedToNextStep={state.canProceedToNextStep}
            currentStep={state.currentStep}
            isSaving={state.isSaving}
          />
        </SheetContent>
      </Sheet>

      <AddPositionReplaceDescriptionDialog
        actions={state.actions}
        open={state.showReplaceConfirmation}
      />
    </>
  );
}
