import type { CustomFieldDefinition, CustomFieldValue, CustomFieldValues } from '@/lib/types';

export interface CustomFieldEditorBaseProps {
  customFields: CustomFieldValues;
  onFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
}

export interface CustomFieldInputProps extends CustomFieldEditorBaseProps {
  definition: CustomFieldDefinition;
}
