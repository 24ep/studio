import type { OrganizationUnitType } from '@/lib/hr/organization-hierarchy';

export interface DepartmentFormState {
  name: string;
  code: string;
  unitType: OrganizationUnitType;
  parentId: string;
  description: string;
  headcountAllocation: string;
  isActive: boolean;
  newParentName: string;
}

export const EMPTY_DEPARTMENT_FORM: DepartmentFormState = {
  name: '',
  code: '',
  unitType: 'division',
  parentId: '',
  description: '',
  headcountAllocation: '',
  isActive: true,
  newParentName: '',
};

export function getDepartmentParentType(type: OrganizationUnitType): OrganizationUnitType | null {
  const types: OrganizationUnitType[] = ['division', 'department', 'section', 'unit'];
  return types[types.indexOf(type) - 1] || null;
}

export function capitalizeDepartmentUnit(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
