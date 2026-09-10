import type { Applicant } from '@/lib/types';

function formatCustomAttributeValue(value: unknown) {
  return typeof value === 'object' ? JSON.stringify(value) : value;
}

export function buildCustomAttributeLines(customAttributes: Applicant['customAttributes']) {
  if (!customAttributes || Object.keys(customAttributes).length === 0) {
    return [];
  }

  return [
    'Custom Attributes:',
    ...Object.entries(customAttributes).map(([key, value]) => `  ${key}: ${formatCustomAttributeValue(value)}`),
  ];
}
