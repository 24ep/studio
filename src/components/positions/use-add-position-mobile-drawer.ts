"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { usePositionLevels } from "@/hooks/use-position-levels";
import {
  ADD_POSITION_DEFAULT_VALUES,
  addPositionFormSchema,
  type AddPositionFormValues,
} from "./add-position-form";
import type {
  AddPositionMobileDrawerActions,
  AddPositionMobileDrawerProps,
  AddPositionMobileDrawerState,
  AddPositionMobileStep,
} from "./AddPositionMobileDrawerTypes";
import { ADD_POSITION_MOBILE_STEP_TITLES } from "./AddPositionMobileDrawerTypes";
import { useAddPositionMobileDescription } from "./use-add-position-mobile-description";
import { useAddPositionMobileReferenceData } from "./use-add-position-mobile-reference-data";

export function useAddPositionMobileDrawer({
  isOpen,
  onAddPosition,
  onOpenChange,
}: AddPositionMobileDrawerProps): AddPositionMobileDrawerState & {
  actions: AddPositionMobileDrawerActions;
} {
  const [currentStep, setCurrentStep] =
    React.useState<AddPositionMobileStep>("basic");
  const [isModalReady, setIsModalReady] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { levels: positionLevels, isLoading: isLoadingLevels } =
    usePositionLevels();

  const form = useForm<AddPositionFormValues>({
    resolver: zodResolver(addPositionFormSchema),
    defaultValues: ADD_POSITION_DEFAULT_VALUES,
  });

  const referenceData = useAddPositionMobileReferenceData({ form, isOpen });
  const description = useAddPositionMobileDescription({ form });
  const basicValues = useWatch({
    control: form.control,
    name: ['title', 'department', 'divisionId', 'departmentId', 'sectionId', 'unitId'],
  });

  React.useEffect(() => {
    if (!isOpen) {
      setIsModalReady(false);
      return;
    }

    setIsModalReady(true);
    setCurrentStep("basic");
    form.reset(ADD_POSITION_DEFAULT_VALUES);
  }, [isOpen, form]);

  const onSubmit = React.useCallback(
    async (data: AddPositionFormValues) => {
      setIsSaving(true);
      try {
        await onAddPosition(data);
        onOpenChange(false);
      } catch (error) {
        console.error("Error adding position:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [onAddPosition, onOpenChange],
  );

  const canProceedToNextStep =
    currentStep !== "basic" ||
    Boolean(basicValues[0]?.trim() && basicValues[1]?.trim()
      && basicValues[2] && basicValues[3] && basicValues[4] && basicValues[5]);
  const stepNumber =
    currentStep === "basic" ? 1 : currentStep === "description" ? 2 : 3;

  const actions: AddPositionMobileDrawerActions = {
    back: () => {
      if (currentStep === "criteria") setCurrentStep("description");
      else if (currentStep === "description") setCurrentStep("basic");
    },
    confirmReplaceDescription: description.confirmReplaceDescription,
    generateJobDescription: description.generateJobDescription,
    next: () => {
      if (currentStep === "basic") setCurrentStep("description");
      else if (currentStep === "description") setCurrentStep("criteria");
    },
    setShowReplaceConfirmation: description.setShowReplaceConfirmation,
    submit: () => {
      void form.handleSubmit(onSubmit)();
    },
  };

  return {
    actions,
    availableRecruiter: referenceData.availableRecruiter,
    canGenerateDescription: description.canGenerateDescription,
    canProceedToNextStep,
    currentStep,
    defaultMatchCriteria: referenceData.defaultMatchCriteria,
    form,
    grades: referenceData.grades,
    isGeneratingDescription: description.isGeneratingDescription,
    isLoadingDefaultCriteria: referenceData.isLoadingDefaultCriteria,
    isLoadingLevels,
    isModalReady,
    isSaving,
    positionLevels,
    organizationUnits: referenceData.organizationUnits,
    showReplaceConfirmation: description.showReplaceConfirmation,
    stepNumber,
    stepTitle: ADD_POSITION_MOBILE_STEP_TITLES[currentStep],
  };
}
