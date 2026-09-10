import type { UseFormReturn } from 'react-hook-form';

import type { CustomFieldValue, UserProfile } from '@/lib/types';

import type { ModalMode, UnifiedUserCustomFields, UnifiedUserFormValues } from './types';

export interface ProfileTabProps {
  form: UseFormReturn<UnifiedUserFormValues>;
  mode: ModalMode;
  user?: UserProfile | null;
  customFields: UnifiedUserCustomFields;
  customFieldDefinitions: unknown[];
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
}
