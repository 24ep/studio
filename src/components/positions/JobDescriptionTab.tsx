"use client";

import type { UseFormReturn } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PositionCustomFieldDisplay } from './PositionCustomFieldDisplay';
import { PositionCustomFieldEdit } from './PositionCustomFieldEdit';
import { cn } from '@/lib/utils';
import type { CustomFieldValue, Position } from '@/lib/types';
import type { EditPositionFormValues } from './position-edit-form';
import {
  JobDescriptionContent,
  JobDescriptionHeader,
} from './JobDescriptionTabParts';

interface JobDescriptionTabProps {
  position: Position;
  isEditMode: boolean;
  isSaving: boolean;
  isGeneratingDescription: boolean;
  isDrawerReady: boolean;
  form: UseFormReturn<EditPositionFormValues>;
  isMobile: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: EditPositionFormValues) => Promise<void>;
  onGenerateJobDescription: () => void;
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
}

export function JobDescriptionTab({
  position,
  isEditMode,
  isSaving,
  isGeneratingDescription,
  isDrawerReady,
  form,
  isMobile,
  onEdit,
  onCancel,
  onSave,
  onGenerateJobDescription,
  onCustomFieldChange,
}: JobDescriptionTabProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className={cn(isMobile ? "p-4 pb-10" : "p-6")}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <JobDescriptionHeader
              isEditMode={isEditMode}
              isSaving={isSaving}
              onCancel={onCancel}
              onEdit={onEdit}
            />

            <JobDescriptionContent
              form={form}
              isDrawerReady={isDrawerReady}
              isEditMode={isEditMode}
              isGeneratingDescription={isGeneratingDescription}
              onGenerateJobDescription={onGenerateJobDescription}
              position={position}
            />

            {isEditMode ? (
              <PositionCustomFieldEdit
                section="description"
                positionId={position?.id || ''}
                customFields={position?.customFields || {}}
                onFieldChange={onCustomFieldChange}
                title="Additional Description details"
              />
            ) : (
              <PositionCustomFieldDisplay
                section="description"
                positionId={position?.id || ''}
                customFields={position?.customFields || {}}
                title="Additional Description details"
              />
            )}
          </form>
        </div>
      </ScrollArea>
    </div>
  );
}
