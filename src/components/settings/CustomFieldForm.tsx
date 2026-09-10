import React, { useCallback } from 'react';
import type { CustomFieldDefinition } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFieldArray, useForm } from 'react-hook-form';
import { CustomFieldFormFields } from './CustomFieldFormFields';
import {
  buildCustomFieldFormValues,
  customFieldFormResolver,
  type CustomFieldFormValues,
} from './CustomFieldFormSchema';

interface CustomFieldFormProps {
  open: boolean;
  definition: CustomFieldDefinition | null;
  onClose: () => void;
  onSubmit: (data: CustomFieldFormValues) => void;
}

const CustomFieldForm: React.FC<CustomFieldFormProps> = ({ open, definition, onClose, onSubmit }: CustomFieldFormProps) => {
  const isEdit = Boolean(definition);
  const form = useForm<CustomFieldFormValues>({
    resolver: customFieldFormResolver,
    defaultValues: buildCustomFieldFormValues(definition),
  });

  const { fields: optionsFields, append: appendOption, remove: removeOption, replace: replaceOptions } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const watchFieldType = form.watch("field_type");

  React.useEffect(() => {
    const formValues = buildCustomFieldFormValues(definition);
    form.reset(formValues);
    replaceOptions(formValues.options || []);
  }, [definition, open, form, replaceOptions]);

  const handleSubmit = useCallback((data: CustomFieldFormValues) => {
    onSubmit(data);
    form.reset(buildCustomFieldFormValues(null));
  }, [form, onSubmit]);

  const handleRemoveOption = useCallback((idx: number) => {
    removeOption(idx);
  }, [removeOption]);

  const handleAppendOption = useCallback(() => {
    appendOption({ value: '', label: '' });
  }, [appendOption]);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Custom Field</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Edit the custom field definition.' : 'Create a new custom field definition.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CustomFieldFormFields
            form={form}
            optionsFields={optionsFields}
            watchFieldType={watchFieldType}
            onAppendOption={handleAppendOption}
            onRemoveOption={handleRemoveOption}
          />
          <DialogFooter>
            <Button type="submit" variant="default">{isEdit ? 'Update' : 'Create'} Field</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomFieldForm; 
