import { Controller, type UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { DetailsFieldRow } from './PositionDetailsFieldRowPrimitives';
import type { EditPositionFormValues } from './position-edit-form';

export function PositionTextFieldRow({
  displayValue,
  errorMessage,
  form,
  isEditMode,
  label,
  name,
  placeholder,
}: {
  displayValue: React.ReactNode;
  errorMessage?: string;
  form: UseFormReturn<EditPositionFormValues>;
  isEditMode: boolean;
  label: string;
  name: 'title' | 'department';
  placeholder: string;
}) {
  return (
    <DetailsFieldRow fieldId={name} label={label}>
      {isEditMode ? (
        <Controller
          name={name}
          control={form.control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder={placeholder}
              className={cn('bg-background', errorMessage ? 'border-red-500' : '')}
            />
          )}
        />
      ) : (
        displayValue
      )}
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </DetailsFieldRow>
  );
}
