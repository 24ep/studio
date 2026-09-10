import type { CustomFieldValue } from './types';

export function getCustomFieldTextInputValue(value: CustomFieldValue): string {
  if (value === null || value === undefined || Array.isArray(value)) return '';
  return String(value);
}

export function getCustomFieldSelectValue(value: CustomFieldValue): string {
  return typeof value === 'string' ? value : '';
}

export function getCustomFieldBooleanValue(value: CustomFieldValue): boolean {
  return value === true;
}

export function getCustomFieldStringArray(value: CustomFieldValue): string[] {
  return Array.isArray(value) ? value : [];
}

export function getCustomFieldDate(value: CustomFieldValue): Date | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
