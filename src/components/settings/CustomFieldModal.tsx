import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { CustomFieldOption, UserGroup } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  CUSTOM_FIELD_FORM_DEFAULT_VALUES,
  customFieldFormSchema,
  type CustomFieldFormValues,
} from './CustomFieldModalSchema';
import {
  CustomFieldBasicInformationSection,
  CustomFieldDisplaySettingsSection,
  CustomFieldOptionsSection,
  CustomFieldRolePermissionsSection,
  CustomFieldVisibilitySettingsSection,
} from './CustomFieldModalSections';

interface CustomFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CustomFieldFormValues) => Promise<void>;
  availableRoles?: UserGroup[];
}

export default function CustomFieldModal({ 
  open, 
  onClose, 
  onSubmit, 
  availableRoles = [] 
}: CustomFieldModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>(availableRoles);

  // Fetch available roles if not provided
  useEffect(() => {
    if (availableRoles.length === 0) {
      fetchAvailableRoles();
    } else {
      setAvailableGroups(availableRoles);
    }
  }, [availableRoles]);

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/settings/user-groups');
      if (response.ok) {
        setAvailableGroups(await readJsonOrFallback<UserGroup[]>(response, []));
      }
    } catch (error) {
      console.error('Failed to fetch available roles:', error);
      toast.error('Failed to load available roles');
    }
  };

  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: CUSTOM_FIELD_FORM_DEFAULT_VALUES,
  });

  const { fields: optionsFields, append: appendOption, remove: removeOption, update: updateOption } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const watchFieldType = form.watch("field_type");
  const watchModelName = form.watch("model_name");
  const isSelectType = watchFieldType === 'select_single' || watchFieldType === 'select_multiple';

  useEffect(() => {
    if (open) {
      form.reset(CUSTOM_FIELD_FORM_DEFAULT_VALUES);
    }
  }, [open, form]);

  const handleSubmit = async (data: CustomFieldFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Custom field created successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting custom field:', error);
      toast.error('Failed to save custom field');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    appendOption({
      value: '',
      label: '',
      color: '#3B82F6',
      sortOrder: optionsFields.length,
      isActive: true,
    });
  };

  const removeOptionField = (index: number) => {
    removeOption(index);
  };

  const updateOptionField = (index: number, field: keyof CustomFieldOption, value: unknown) => {
    updateOption(index, { ...optionsFields[index], [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        dialogId="custom-field-modal"
        className="max-w-4xl max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create Custom Field
          </DialogTitle>
          <DialogDescription>
            Configure custom attributes for {watchModelName.toLowerCase()}s with advanced settings and permissions.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
              <CustomFieldBasicInformationSection
                control={form.control}
                modelName={watchModelName}
                fieldType={watchFieldType}
              />

              <CustomFieldRolePermissionsSection
                control={form.control}
                availableGroups={availableGroups}
              />

              <CustomFieldVisibilitySettingsSection
                control={form.control}
                modelName={watchModelName}
              />

              {isSelectType && (
                <CustomFieldOptionsSection
                  control={form.control}
                  optionsFields={optionsFields}
                  onAddOption={addOption}
                  onRemoveOption={removeOptionField}
                  onUpdateOption={updateOptionField}
                />
              )}

              <CustomFieldDisplaySettingsSection control={form.control} />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
