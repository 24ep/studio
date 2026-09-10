import type { CustomFieldDefinition } from './types';
import { readJsonOrFallback } from './response-json';
import {
  filterCustomFieldsBySection,
  type CustomFieldModelName,
} from './customFieldVisibility';

async function fetchCustomFieldDefinitions() {
  const response = await fetch('/api/settings/custom-field-definitions', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch custom field definitions');
  }

  return readJsonOrFallback<CustomFieldDefinition[]>(response, []);
}

async function fetchCustomFieldsWithFallback() {
  try {
    return await fetchCustomFieldDefinitions();
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return [];
  }
}

export async function fetchCustomFieldsForSection(
  modelName: CustomFieldModelName,
  section?: string,
): Promise<CustomFieldDefinition[]> {
  const allFields = await fetchCustomFieldsWithFallback();

  if (section) {
    return filterCustomFieldsBySection(allFields, section, modelName);
  }

  return allFields.filter((field) => field.model_name === modelName);
}

export async function fetchFilterableCustomFields(
  modelName: CustomFieldModelName,
): Promise<CustomFieldDefinition[]> {
  const allFields = await fetchCustomFieldsWithFallback();

  return allFields.filter(
    (field) => field.model_name === modelName && field.showInFilter,
  );
}

export async function fetchTaskBoardFilterableCustomFields(
  modelName: CustomFieldModelName,
): Promise<CustomFieldDefinition[]> {
  const allFields = await fetchCustomFieldsWithFallback();

  return allFields.filter(
    (field) => field.model_name === modelName && field.showInTaskBoardFilter,
  );
}
