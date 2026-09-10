import type {
  UnifiedUserCustomFields,
  UnifiedUserFormValues,
} from './types';

export function withAzureAdAuthenticationMethod(methods: string[] = []) {
  return methods.includes('azure_ad') ? methods : [...methods, 'azure_ad'];
}

export function buildUnifiedUserSavePayload(
  data: UnifiedUserFormValues,
  customFields: UnifiedUserCustomFields
): UnifiedUserFormValues & { customFields: UnifiedUserCustomFields } {
  return {
    ...data,
    customFields,
  };
}
