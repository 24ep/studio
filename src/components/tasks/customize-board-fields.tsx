import { Ban, BarChart2, Briefcase, FileText, Target, User } from 'lucide-react';

import type { BoardFieldOption } from './CustomizeBoardMultiSelect';
import type { BoardApplicant } from './customize-board-types';

export const DEFAULT_VISIBLE_BOARD_FIELDS = ['name', 'email', 'status', 'fitScore'];

export const applicantFields: BoardFieldOption[] = [
  { key: 'none', label: 'None', icon: <Ban className="w-4 h-4" /> },
  { key: 'status', label: 'Status', icon: <BarChart2 className="w-4 h-4" /> },
  { key: 'recruiterId', label: 'Recruiter', icon: <User className="w-4 h-4" /> },
  { key: 'positionId', label: 'Position', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'fitScore', label: 'Fit Score', icon: <Target className="w-4 h-4" /> },
];

export function cleanFieldValues(values: string[] = []) {
  return values.filter(value => typeof value === 'string' && value.trim() !== '');
}

export function getCustomFieldKeys(applicants: BoardApplicant[]): string[] {
  const keys = new Set<string>();
  const safeApplicants = Array.isArray(applicants) ? applicants : [];

  safeApplicants.forEach((applicant) => {
    if (applicant.customAttributes && typeof applicant.customAttributes === 'object') {
      Object.keys(applicant.customAttributes).forEach(key => keys.add(key));
    }
  });

  return Array.from(keys);
}

export function getParsedDataKeys(applicants: BoardApplicant[]): string[] {
  const keys = new Set<string>();
  const safeApplicants = Array.isArray(applicants) ? applicants : [];

  const extractKeys = (obj: unknown, prefix = '') => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return;
    }

    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.add(fullKey);
      extractKeys((obj as Record<string, unknown>)[key], fullKey);
    });
  };

  safeApplicants.forEach((applicant) => {
    if (applicant.parsedData && typeof applicant.parsedData === 'object') {
      extractKeys(applicant.parsedData);
    }
  });

  return Array.from(keys);
}

export function formatBoardFieldLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function buildDynamicApplicantFields(customFieldKeys: string[], parsedDataKeys: string[]) {
  const allFieldKeys = new Set([
    ...applicantFields.map(field => field.key),
    ...customFieldKeys,
  ]);
  const parsedDataFieldObjs = parsedDataKeys
    .filter(key => !allFieldKeys.has(key))
    .map(key => buildFileTextFieldOption(key));

  return {
    dynamicApplicantFields: [
      ...applicantFields,
      ...customFieldKeys.map(key => buildFileTextFieldOption(key)),
      ...parsedDataFieldObjs,
    ],
    parsedDataFieldObjs,
  };
}

export function buildRowAndColumnFields(customFieldKeys: string[], parsedDataFieldObjs: BoardFieldOption[]) {
  const hiddenFieldKeys = ['name', 'email', 'phone'];
  const baseRowColumnFields = [
    ...applicantFields.filter(field => !hiddenFieldKeys.includes(field.key)),
    ...customFieldKeys
      .filter(key => !hiddenFieldKeys.includes(key))
      .map(key => buildFileTextFieldOption(key)),
    ...parsedDataFieldObjs.filter(field => !hiddenFieldKeys.includes(field.key)),
  ];
  const seenKeys = new Set<string>();

  return baseRowColumnFields.filter((field) => {
    if (seenKeys.has(field.key)) {
      return false;
    }

    seenKeys.add(field.key);
    return true;
  });
}

export function buildCardFields(rowAndColumnFields: BoardFieldOption[], parsedDataFieldObjs: BoardFieldOption[]) {
  return [
    ...rowAndColumnFields,
    ...parsedDataFieldObjs.filter(field => ['name', 'email', 'phone'].includes(field.key)),
  ];
}

function buildFileTextFieldOption(key: string) {
  return { key, label: formatBoardFieldLabel(key), icon: <FileText className="w-4 h-4" /> };
}
