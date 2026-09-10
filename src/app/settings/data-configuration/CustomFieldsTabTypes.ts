import type { CustomFieldFormValues as CustomFieldDrawerFormValues } from '@/components/settings/CustomFieldDrawerParts';
import type { CustomFieldFormValues as CustomFieldModalFormValues } from '@/components/settings/CustomFieldModalSchema';

export type CustomFieldFormValues = CustomFieldDrawerFormValues | CustomFieldModalFormValues;

export type CustomFieldMutationResult = {
  label?: string;
  message?: string;
};
