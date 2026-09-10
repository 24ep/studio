import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { usePositionLevels } from '@/hooks/use-position-levels';

import {
  ADD_POSITION_DEFAULT_VALUES,
  addPositionFormSchema,
  type AddPositionFormValues,
} from './add-position-form';
import { useAddPositionDescriptionGenerator } from './use-add-position-description-generator';
import { useAddPositionReferenceData } from './use-add-position-reference-data';

export type AddPositionStep = 'basic' | 'description' | 'criteria' | 'equipment';

const ADD_POSITION_DRAFT_KEY = 'hrive:add-position-draft';

interface UseAddPositionModalControllerInput {
  isOpen: boolean;
  onAddPosition: (data: AddPositionFormValues) => Promise<void>;
}

export function useAddPositionModalController({
  isOpen,
  onAddPosition,
}: UseAddPositionModalControllerInput) {
  const [currentStep, setCurrentStep] = useState<AddPositionStep>('basic');
  const [isModalReady, setIsModalReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { levels: positionLevels, isLoading: isLoadingLevels } = usePositionLevels();

  const form = useForm<AddPositionFormValues>({
    resolver: zodResolver(addPositionFormSchema),
    defaultValues: ADD_POSITION_DEFAULT_VALUES,
  });

  const referenceData = useAddPositionReferenceData({ form, isOpen });
  const descriptionGenerator = useAddPositionDescriptionGenerator(form);

  const nextStep = async () => {
    if (currentStep === 'basic') {
      const isBasicInfoValid = await form.trigger(['title', 'department', 'divisionId', 'departmentId', 'sectionId', 'unitId']);
      if (!isBasicInfoValid) return;
      setCurrentStep('description');
      return;
    }

    if (currentStep === 'description') {
      setCurrentStep('criteria');
      return;
    }

    if (currentStep === 'criteria') {
      setCurrentStep('equipment');
    }
  };

  const previousStep = () => {
    setCurrentStep((step) => {
      if (step === 'equipment') return 'criteria';
      if (step === 'criteria') return 'description';
      return 'basic';
    });
  };

  const onSubmit = async (data: AddPositionFormValues) => {
    setIsSaving(true);
    try {
      await onAddPosition(data);
      window.localStorage.removeItem(ADD_POSITION_DRAFT_KEY);
    } catch (err) {
      console.error('Error adding position:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = () => {
    window.localStorage.setItem(ADD_POSITION_DRAFT_KEY, JSON.stringify(form.getValues()));
    toast.success('Position draft saved');
  };

  useEffect(() => {
    if (!isOpen) {
      setIsModalReady(false);
      return;
    }

    setIsModalReady(true);
    setCurrentStep('basic');
    try {
      const savedDraft = window.localStorage.getItem(ADD_POSITION_DRAFT_KEY);
      const parsedDraft = savedDraft ? JSON.parse(savedDraft) as Partial<AddPositionFormValues> : null;
      form.reset(parsedDraft ? { ...ADD_POSITION_DEFAULT_VALUES, ...parsedDraft } : ADD_POSITION_DEFAULT_VALUES);
    } catch {
      form.reset(ADD_POSITION_DEFAULT_VALUES);
    }
  }, [form, isOpen]);

  return {
    availableRecruiter: referenceData.availableRecruiter,
    canGenerateDescription: descriptionGenerator.canGenerateDescription,
    currentStep,
    defaultMatchCriteria: referenceData.defaultMatchCriteria,
    form,
    generateJobDescription: descriptionGenerator.generateJobDescription,
    grades: referenceData.grades,
    handleConfirmReplace: descriptionGenerator.handleConfirmReplace,
    isGeneratingDescription: descriptionGenerator.isGeneratingDescription,
    isLoadingDefaultCriteria: referenceData.isLoadingDefaultCriteria,
    isLoadingLevels,
    isModalReady,
    isSaving,
    nextStep,
    onSubmit,
    positionLevels,
    organizationUnits: referenceData.organizationUnits,
    previousStep,
    saveDraft,
    setShowReplaceConfirmation: descriptionGenerator.setShowReplaceConfirmation,
    showReplaceConfirmation: descriptionGenerator.showReplaceConfirmation,
  };
}
