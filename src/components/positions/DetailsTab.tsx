"use client";

import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CustomFieldValue, Grade, Position } from '@/lib/types';
import type { EditPositionFormValues } from './position-edit-form';
import {
  DetailsTabHeader,
  PositionDetailsCustomFields,
  PositionDetailsFields,
} from './DetailsTabParts';

interface DetailsTabProps {
  position: Position;
  isEditMode: boolean;
  isSaving: boolean;
  isDrawerReady: boolean;
  isLoadingLevels: boolean;
  positionLevels: Array<{ id: string; name: string; color?: string }>;
  grades: Grade[];
  availableRecruiters: Array<{ id: string; name: string; avatarUrl?: string | null; personalColor?: string | null }>;
  form: UseFormReturn<EditPositionFormValues>;
  isMobile: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: EditPositionFormValues) => Promise<void>;
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
}

export function DetailsTab({
  position,
  isEditMode,
  isSaving,
  isLoadingLevels,
  positionLevels,
  grades,
  availableRecruiters,
  form,
  isMobile,
  onEdit,
  onCancel,
  onSave,
  onCustomFieldChange,
}: DetailsTabProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className={cn(isMobile ? 'p-4 pb-10' : 'p-6')}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <DetailsTabHeader
              isEditMode={isEditMode}
              isSaving={isSaving}
              onCancel={onCancel}
              onEdit={onEdit}
            />
            <PositionDetailsFields
              availableRecruiters={availableRecruiters}
              form={form}
              grades={grades}
              isEditMode={isEditMode}
              isLoadingLevels={isLoadingLevels}
              position={position}
              positionLevels={positionLevels}
            />
            <PositionDetailsCustomFields
              isEditMode={isEditMode}
              onCustomFieldChange={onCustomFieldChange}
              position={position}
            />
          </form>
        </div>
      </ScrollArea>
    </div>
  );
}
