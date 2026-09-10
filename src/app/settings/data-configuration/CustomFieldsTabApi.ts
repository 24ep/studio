import type { CustomFieldDefinition } from '@/lib/types';
import {
  getJsonErrorMessage,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import type {
  CustomFieldFormValues,
  CustomFieldMutationResult,
} from './CustomFieldsTabTypes';

export async function fetchCustomFieldDefinitions() {
  const response = await fetch('/api/settings/custom-field-definitions');
  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: 'Failed to fetch definitions' },
    );
    throw new Error(errorData.message);
  }

  return readJsonOrFallback<CustomFieldDefinition[]>(response, []);
}

export async function saveCustomFieldDefinition({
  data,
  editingDefinition,
}: {
  data: CustomFieldFormValues;
  editingDefinition: CustomFieldDefinition | null;
}) {
  const url = editingDefinition
    ? `/api/settings/custom-field-definitions/${editingDefinition.id}`
    : '/api/settings/custom-field-definitions';
  const method = editingDefinition ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await readJsonOrFallback<CustomFieldMutationResult>(response, {});

  if (!response.ok) {
    throw new Error(result.message || `Failed to ${editingDefinition ? 'update' : 'create'} definition`);
  }

  return result;
}

export async function deleteCustomFieldDefinition(definitionId: string) {
  const response = await fetch(`/api/settings/custom-field-definitions/${definitionId}`, { method: 'DELETE' });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, 'Failed to delete definition'));
  }
}
