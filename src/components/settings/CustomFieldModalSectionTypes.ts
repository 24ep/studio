import type { Control, FieldArrayWithId } from 'react-hook-form';
import type { CustomFieldOption, CustomFieldType, UserGroup } from '@/lib/types';
import type { CustomFieldFormValues } from './CustomFieldModalSchema';

export interface CustomFieldSectionProps {
  control: Control<CustomFieldFormValues>;
}

export interface CustomFieldBasicInformationSectionProps extends CustomFieldSectionProps {
  modelName: CustomFieldFormValues['model_name'];
  fieldType: CustomFieldType;
}

export interface CustomFieldRolePermissionsSectionProps extends CustomFieldSectionProps {
  availableGroups: UserGroup[];
}

export interface CustomFieldVisibilitySettingsSectionProps extends CustomFieldSectionProps {
  modelName: CustomFieldFormValues['model_name'];
}

export interface CustomFieldOptionsSectionProps extends CustomFieldSectionProps {
  optionsFields: FieldArrayWithId<CustomFieldFormValues, 'options', 'id'>[];
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (index: number, field: keyof CustomFieldOption, value: unknown) => void;
}
