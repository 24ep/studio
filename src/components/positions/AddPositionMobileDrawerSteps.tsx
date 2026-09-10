"use client";

import type { UseFormReturn } from 'react-hook-form';
import { BrainCircuit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Grade, PositionLevel } from '@/lib/types';

import type { AddPositionFormValues } from './add-position-form';
import {
  MobileGradeField,
  MobileOpenPositionField,
  MobilePositionLevelField,
  MobileRecruiterField,
  MobileTextField,
} from './AddPositionMobileBasicFields';
import type { RecruiterOption } from './AddPositionMobileDrawerTypes';
import { AddPositionMobileRichTextStep } from './AddPositionMobileRichTextStep';
import { PositionOrganizationPathFields, type OrganizationUnitOption } from './PositionOrganizationPathFields';

interface MobileStepProps {
  form: UseFormReturn<AddPositionFormValues>;
}

export function AddPositionMobileBasicStep({
  availableRecruiter,
  form,
  grades,
  isLoadingLevels,
  isSaving,
  positionLevels,
  organizationUnits,
}: MobileStepProps & {
  availableRecruiter: RecruiterOption[];
  grades: Grade[];
  isLoadingLevels: boolean;
  isSaving: boolean;
  positionLevels: PositionLevel[];
  organizationUnits: OrganizationUnitOption[];
}) {
  return (
    <div className="space-y-4">
      <MobileTextField
        disabled={isSaving}
        error={form.formState.errors.title?.message}
        id="title-mobile"
        label="Position Title *"
        placeholder="e.g., Senior Software Engineer"
        register={form.register('title')}
      />
      <PositionOrganizationPathFields form={form} units={organizationUnits} disabled={isSaving} mobile />
      <MobilePositionLevelField
        form={form}
        isLoadingLevels={isLoadingLevels}
        isSaving={isSaving}
        positionLevels={positionLevels}
      />
      <MobileGradeField form={form} grades={grades} />
      <MobileRecruiterField form={form} recruiters={availableRecruiter} />
      <MobileOpenPositionField form={form} />
    </div>
  );
}

export function AddPositionMobileDescriptionStep({
  canGenerateDescription,
  form,
  isGeneratingDescription,
  isModalReady,
  onGenerateJobDescription,
}: MobileStepProps & {
  canGenerateDescription: boolean;
  isGeneratingDescription: boolean;
  isModalReady: boolean;
  onGenerateJobDescription: () => void;
}) {
  return (
    <AddPositionMobileRichTextStep
      form={form}
      name="description"
      label="Job Description"
      placeholder="Enter job description..."
      expandTitle="Edit Job Description"
      isModalReady={isModalReady}
      action={(
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGenerateJobDescription}
          disabled={isGeneratingDescription || !canGenerateDescription}
          className="flex items-center gap-2"
        >
          <BrainCircuit className="h-3 w-3" />
          {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
        </Button>
      )}
    />
  );
}

export function AddPositionMobileCriteriaStep({
  defaultMatchCriteria,
  form,
  isLoadingDefaultCriteria,
  isModalReady,
}: MobileStepProps & {
  defaultMatchCriteria: string;
  isLoadingDefaultCriteria: boolean;
  isModalReady: boolean;
}) {
  return (
    <AddPositionMobileRichTextStep
      form={form}
      name="matchCriteria"
      label="Match Criteria"
      placeholder="Enter match criteria..."
      expandTitle="Edit Match Criteria"
      isModalReady={isModalReady}
      action={(
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => form.setValue('matchCriteria', defaultMatchCriteria)}
          disabled={!defaultMatchCriteria || isLoadingDefaultCriteria}
        >
          Set Default
        </Button>
      )}
    />
  );
}
