import { describe, expect, it } from 'vitest';

import {
  buildDepartmentHierarchy,
  filterDepartmentUnits,
  getDepartmentHierarchyStats,
  normalizeDepartmentUnit,
  type DepartmentUnit,
} from './department-hierarchy-utils';

const units: DepartmentUnit[] = [
  {
    id: 'division-1',
    name: 'Technology',
    code: 'DIV-TECH',
    division: 'Technology',
    department: 'Technology',
    section: 'Technology',
    unitType: 'division',
    parentId: null,
    sortOrder: 1,
    description: '',
    isActive: true,
    employeeCount: 0,
    headcountAllocation: null,
    headcountUsage: 0,
  },
  {
    id: 'department-1',
    name: 'Engineering',
    code: 'DEPT-ENG',
    division: 'Technology',
    department: 'Engineering',
    section: 'Engineering',
    unitType: 'department',
    parentId: 'division-1',
    sortOrder: 0,
    description: '',
    isActive: true,
    employeeCount: 0,
    headcountAllocation: null,
    headcountUsage: 0,
  },
  {
    id: 'section-1',
    name: 'Platform',
    code: 'SEC-PLT',
    division: 'Technology',
    department: 'Engineering',
    section: 'Platform',
    unitType: 'section',
    parentId: 'department-1',
    sortOrder: 0,
    description: '',
    isActive: true,
    employeeCount: 0,
    headcountAllocation: null,
    headcountUsage: 0,
  },
  {
    id: 'unit-1',
    name: 'Cloud Operations',
    code: 'UNIT-CLOUD',
    division: 'Technology',
    department: 'Engineering',
    section: 'Platform',
    unitType: 'unit',
    parentId: 'section-1',
    sortOrder: 0,
    description: '',
    isActive: true,
    employeeCount: 12,
    headcountAllocation: null,
    headcountUsage: 0,
  },
  {
    id: 'division-2',
    name: 'Corporate',
    code: 'DIV-CORP',
    division: 'Corporate',
    department: 'Corporate',
    section: 'Corporate',
    unitType: 'division',
    parentId: null,
    sortOrder: 0,
    description: '',
    isActive: false,
    employeeCount: 4,
    headcountAllocation: null,
    headcountUsage: 0,
  },
];

describe('department hierarchy utilities', () => {
  it('normalizes explicit hierarchy metadata from API records', () => {
    expect(normalizeDepartmentUnit({
      id: 'unit-1',
      name: 'Payroll',
      division: 'Corporate',
      department: 'Finance',
      section: 'Payroll',
      unitType: 'section',
      parentId: 'department-1',
      sortOrder: '3',
      isActive: 'true',
      employeeCount: '5',
    })).toMatchObject({
      unitType: 'section',
      parentId: 'department-1',
      sortOrder: 3,
      isActive: true,
      employeeCount: 5,
      code: '',
    });
  });

  it('builds a sorted explicit hierarchy and rolls up employee counts', () => {
    const hierarchy = buildDepartmentHierarchy(units);

    expect(hierarchy.map(node => node.unit.name)).toEqual(['Corporate', 'Technology']);
    expect(hierarchy[1].children[0].unit.name).toBe('Engineering');
    expect(hierarchy[1].children[0].children[0].unit.name).toBe('Platform');
    expect(hierarchy[1].employeeCount).toBe(12);
  });

  it('keeps ancestors when a child matches a search', () => {
    const filtered = filterDepartmentUnits(units, 'cloud', 'all');
    expect(filtered.map(unit => unit.id)).toEqual([
      'division-1',
      'department-1',
      'section-1',
      'unit-1',
    ]);
    expect(filterDepartmentUnits(units, '', 'inactive').map(unit => unit.id)).toEqual(['division-2']);
  });

  it('calculates hierarchy metrics from explicit node types', () => {
    expect(getDepartmentHierarchyStats(units)).toEqual({
      divisions: 2,
      departments: 1,
      sections: 1,
      employees: 16,
    });
  });
});
