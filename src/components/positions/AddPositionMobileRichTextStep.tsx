"use client";

import type { ReactNode } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { TiptapEditorWithExpand } from '@/components/ui/wysiwyg-editors';

import type { AddPositionFormValues } from './add-position-form';

interface AddPositionMobileRichTextStepProps {
  action?: ReactNode;
  expandTitle: string;
  form: UseFormReturn<AddPositionFormValues>;
  isModalReady: boolean;
  label: string;
  name: 'description' | 'matchCriteria';
  placeholder: string;
}

export function AddPositionMobileRichTextStep({
  action,
  expandTitle,
  form,
  isModalReady,
  label,
  name,
  placeholder,
}: AddPositionMobileRichTextStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {action}
      </div>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <div className="min-h-[400px]">
            <TiptapEditorWithExpand
              value={field.value || ''}
              onChange={field.onChange}
              placeholder={placeholder}
              className="min-h-[400px]"
              isOpen={isModalReady}
              expandTitle={expandTitle}
            />
          </div>
        )}
      />
    </div>
  );
}
