import type { CustomizeBoardPreferenceOptions } from './customize-board-types';

export function parsePreferenceList(value: string | null | undefined, fallback: string[] = []) {
  try {
    return JSON.parse(value || '[]') || fallback;
  } catch {
    return fallback;
  }
}

export function buildCustomizeBoardPreferences({
  columnField,
  rowField,
  visibleColumnValues,
  visibleFields,
  visibleRowValues,
}: CustomizeBoardPreferenceOptions) {
  const rowValuesToSave = rowField === 'none' ? [] : visibleRowValues;

  return [
    { modelType: 'Applicant', attributeKey: 'mytasks_rowField', uiPreference: 'Standard', customNote: rowField },
    { modelType: 'Applicant', attributeKey: 'mytasks_columnField', uiPreference: 'Standard', customNote: columnField },
    { modelType: 'Applicant', attributeKey: 'mytasks_visibleRowValues', uiPreference: 'Standard', customNote: JSON.stringify(rowValuesToSave) },
    { modelType: 'Applicant', attributeKey: 'mytasks_visibleColumnValues', uiPreference: 'Standard', customNote: JSON.stringify(visibleColumnValues) },
    { modelType: 'Applicant', attributeKey: 'mytasks_visibleFields', uiPreference: 'Standard', customNote: JSON.stringify(visibleFields) },
  ];
}
