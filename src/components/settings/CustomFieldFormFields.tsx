import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import type { FieldArrayWithId, UseFormReturn } from 'react-hook-form';
import type { CustomFieldFormValues } from './CustomFieldFormSchema';

interface CustomFieldFormFieldsProps {
  form: UseFormReturn<CustomFieldFormValues>;
  optionsFields: FieldArrayWithId<CustomFieldFormValues, 'options', 'id'>[];
  watchFieldType: CustomFieldFormValues['field_type'];
  onAppendOption: () => void;
  onRemoveOption: (index: number) => void;
}

export function CustomFieldFormFields({
  form,
  optionsFields,
  watchFieldType,
  onAppendOption,
  onRemoveOption,
}: CustomFieldFormFieldsProps) {
  const optionsErrorMessage = form.formState.errors.options?.message;

  return (
    <>
      <CustomFieldIdentityFields form={form} />
      <CustomFieldTypeFields form={form} />
      {(watchFieldType === 'select_single' || watchFieldType === 'select_multiple') && (
        <CustomFieldOptionsFields
          form={form}
          optionsFields={optionsFields}
          optionsErrorMessage={typeof optionsErrorMessage === 'string' ? optionsErrorMessage : undefined}
          onAppendOption={onAppendOption}
          onRemoveOption={onRemoveOption}
        />
      )}
      <CustomFieldBehaviorFields form={form} />
    </>
  );
}

function CustomFieldIdentityFields({ form }: { form: UseFormReturn<CustomFieldFormValues> }) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Model</label>
        <select {...form.register('model_name')} className="w-full border rounded p-2 bg-background">
          <option value="Applicant">Applicant</option>
          <option value="Position">Position</option>
          <option value="User">User</option>
          <option value="Headcount">Headcount</option>
        </select>
        {form.formState.errors.model_name && (
          <span className="text-red-500 text-xs">{form.formState.errors.model_name.message}</span>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Field Key</label>
        <input {...form.register('field_key')} className="w-full border rounded p-2 bg-background" placeholder="e.g. linkedin_url" />
        {form.formState.errors.field_key && (
          <span className="text-red-500 text-xs">{form.formState.errors.field_key.message}</span>
        )}
      </div>
    </div>
  );
}

function CustomFieldTypeFields({ form }: { form: UseFormReturn<CustomFieldFormValues> }) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Label</label>
        <input {...form.register('label')} className="w-full border rounded p-2 bg-background" placeholder="e.g. LinkedIn URL" />
        {form.formState.errors.label && (
          <span className="text-red-500 text-xs">{form.formState.errors.label.message}</span>
        )}
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Field Type</label>
        <select {...form.register('field_type')} className="w-full border rounded p-2 bg-background">
          {CUSTOM_FIELD_TYPES.map(type => (
            <option key={type} value={type}>{type.replace('_', ' ')}</option>
          ))}
        </select>
        {form.formState.errors.field_type && (
          <span className="text-red-500 text-xs">{form.formState.errors.field_type.message}</span>
        )}
      </div>
    </div>
  );
}

function CustomFieldOptionsFields({
  form,
  optionsFields,
  optionsErrorMessage,
  onAppendOption,
  onRemoveOption,
}: {
  form: UseFormReturn<CustomFieldFormValues>;
  optionsFields: FieldArrayWithId<CustomFieldFormValues, 'options', 'id'>[];
  optionsErrorMessage?: string;
  onAppendOption: () => void;
  onRemoveOption: (index: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Options</label>
      <div className="space-y-2">
        {optionsFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-center">
            <input {...form.register(`options.${index}.value`)} className="border rounded p-2 flex-1" placeholder="Value" />
            <input {...form.register(`options.${index}.label`)} className="border rounded p-2 flex-1" placeholder="Label" />
            <button type="button" className="text-red-500 px-2" onClick={() => onRemoveOption(index)}>Remove</button>
          </div>
        ))}
        <button type="button" className="text-blue-600 text-sm" onClick={onAppendOption}>+ Add Option</button>
      </div>
      {optionsErrorMessage && <span className="text-red-500 text-xs">{optionsErrorMessage}</span>}
    </div>
  );
}

function CustomFieldBehaviorFields({ form }: { form: UseFormReturn<CustomFieldFormValues> }) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex items-center gap-2">
        <input type="checkbox" {...form.register('is_required')} id="is_required" />
        <label htmlFor="is_required" className="text-sm">Required</label>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Sort Order</label>
        <input type="number" {...form.register('sort_order', { valueAsNumber: true })} className="w-24 border rounded p-2" />
        {form.formState.errors.sort_order && (
          <span className="text-red-500 text-xs">{form.formState.errors.sort_order.message}</span>
        )}
      </div>
    </div>
  );
}
