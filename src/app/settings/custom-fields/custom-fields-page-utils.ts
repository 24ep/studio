import type { CustomFieldDefinition } from '@/lib/types';

export type CustomFieldPermissionUser = {
  role?: string | null;
  modulePermissions?: string[] | null;
};

export type CustomFieldMutationResult = {
  label?: string;
  message?: string;
};

export function canManageCustomFieldDefinitions(user: CustomFieldPermissionUser | null | undefined) {
  return user?.role === 'Admin' || (user?.modulePermissions || []).includes('CUSTOM_FIELDS_EDIT');
}

export function getCustomFieldSubmitTarget(editingDefinition: CustomFieldDefinition | null) {
  return editingDefinition
    ? {
      method: 'PUT',
      url: `/api/settings/custom-field-definitions?id=${editingDefinition.id}`,
      action: 'update',
    }
    : {
      method: 'POST',
      url: '/api/settings/custom-field-definitions',
      action: 'create',
    };
}

export function getCustomFieldSuccessMessage({
  fallbackLabel,
  isEditing,
  result,
}: {
  fallbackLabel: string;
  isEditing: boolean;
  result: CustomFieldMutationResult;
}) {
  return `Definition "${result.label ?? fallbackLabel}" was successfully ${isEditing ? 'updated' : 'created'}.`;
}
