import type {
  CompanyPortalCmsFieldType,
  CompanyPortalDataFilterOperator,
} from './company-portal-builder';

export interface CompanyPortalFilterOperatorOption {
  value: CompanyPortalDataFilterOperator;
  label: string;
}

const EQUALS = { value: 'equals', label: 'Equals' } as const;
const NOT_EQUALS = { value: 'not_equals', label: 'Does not equal' } as const;
const CONTAINS = { value: 'contains', label: 'Contains' } as const;
const IS_EMPTY = { value: 'is_empty', label: 'Is empty' } as const;
const IS_NOT_EMPTY = { value: 'is_not_empty', label: 'Is not empty' } as const;
const GREATER_THAN = { value: 'greater_than', label: 'Greater than' } as const;
const LESS_THAN = { value: 'less_than', label: 'Less than' } as const;

const TEXT_OPERATORS: CompanyPortalFilterOperatorOption[] = [
  EQUALS,
  NOT_EQUALS,
  CONTAINS,
  IS_EMPTY,
  IS_NOT_EMPTY,
];

const ORDERED_OPERATORS: CompanyPortalFilterOperatorOption[] = [
  EQUALS,
  NOT_EQUALS,
  GREATER_THAN,
  LESS_THAN,
  IS_EMPTY,
  IS_NOT_EMPTY,
];

const BOOLEAN_OPERATORS: CompanyPortalFilterOperatorOption[] = [
  EQUALS,
  NOT_EQUALS,
  IS_EMPTY,
  IS_NOT_EMPTY,
];

export function getCompanyPortalFilterOperators(
  fieldType: CompanyPortalCmsFieldType,
): CompanyPortalFilterOperatorOption[] {
  if (fieldType === 'number' || fieldType === 'date') return ORDERED_OPERATORS;
  if (fieldType === 'boolean') return BOOLEAN_OPERATORS;
  return TEXT_OPERATORS;
}

export function normalizeCompanyPortalFilterOperator(
  fieldType: CompanyPortalCmsFieldType,
  operator: CompanyPortalDataFilterOperator,
): CompanyPortalDataFilterOperator {
  const operators = getCompanyPortalFilterOperators(fieldType);
  return operators.some(option => option.value === operator)
    ? operator
    : operators[0].value;
}
