import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import type { CustomFieldDefinition, CustomFieldOption, UserGroup } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';
import type { CustomFieldDrawerTab } from './CustomFieldDrawerTabs';
import {
  buildCustomFieldFormValues,
  customFieldFormResolver,
  EMPTY_CUSTOM_FIELD_FORM_VALUES,
  type CustomFieldFormValues,
} from './CustomFieldDrawerParts';

interface UseCustomFieldDrawerControllerParams {
  availableRoles: UserGroup[];
  definition?: CustomFieldDefinition | null;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (data: CustomFieldFormValues) => Promise<void>;
  open: boolean;
}

export function useCustomFieldDrawerController({
  availableRoles,
  definition,
  isEdit,
  onClose,
  onSubmit,
  open,
}: UseCustomFieldDrawerControllerParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>(availableRoles);
  const [activeTab, setActiveTab] = useState<CustomFieldDrawerTab>('basic');

  const form = useForm<CustomFieldFormValues>({
    resolver: customFieldFormResolver,
    defaultValues: EMPTY_CUSTOM_FIELD_FORM_VALUES,
  });

  const { fields: optionsFields, append: appendOption, remove: removeOption, update: updateOption } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const watchFieldType = form.watch('field_type');
  const watchModelName = form.watch('model_name');
  const watchShowInFullApplicantDetail = form.watch('showInFullApplicantDetail');
  const watchShowInApplicantDetail = form.watch('showInApplicantDetail');
  const watchShowInPositionSettings = form.watch('showInPositionSettings');
  const isSelectType = watchFieldType === 'select_single' || watchFieldType === 'select_multiple';

  useEffect(() => {
    if (availableRoles.length === 0) {
      fetchAvailableRoles(setAvailableGroups);
      return;
    }

    setAvailableGroups(availableRoles);
  }, [availableRoles]);

  useEffect(() => {
    if (open) {
      form.reset(buildCustomFieldFormValues(definition));
    }
  }, [definition, open, form]);

  const handleSubmit = async (data: CustomFieldFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(isEdit ? 'Custom field updated successfully' : 'Custom field created successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting custom field:', error);
      toast.error('Failed to save custom field');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    form.handleSubmit(handleSubmit, (errors) => {
      console.error('Form validation errors:', errors);
      const errorMessages = Object.values(errors).map(error => error?.message).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(`Validation errors: ${errorMessages.join(', ')}`);
      } else {
        toast.error('Please check the form for errors');
      }
    })();
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

  const updateOptionField = (index: number, field: keyof CustomFieldOption, value: string | boolean) => {
    updateOption(index, { ...optionsFields[index], [field]: value });
  };

  return {
    activeTab,
    addOption,
    availableGroups,
    form,
    handleFormSubmit,
    handleSubmit,
    isSelectType,
    isSubmitting,
    optionsFields,
    removeOptionField,
    setActiveTab,
    updateOptionField,
    watchFieldType,
    watchModelName,
    watchShowInApplicantDetail,
    watchShowInFullApplicantDetail,
    watchShowInPositionSettings,
  };
}

async function fetchAvailableRoles(setAvailableGroups: (groups: UserGroup[]) => void) {
  try {
    const response = await fetch('/api/settings/user-groups');
    if (response.ok) {
      setAvailableGroups(await readJsonOrFallback<UserGroup[]>(response, []));
    }
  } catch (error) {
    console.error('Failed to fetch available roles:', error);
    toast.error('Failed to load available roles');
  }
}
