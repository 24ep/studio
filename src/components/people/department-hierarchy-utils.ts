import type { OrganizationUnitType } from '@/lib/hr/organization-hierarchy';

export interface DepartmentUnit {
  id: string;
  name: string;
  code: string;
  division: string;
  department: string;
  section: string;
  unitType: OrganizationUnitType;
  parentId: string | null;
  sortOrder: number;
  description: string;
  isActive: boolean;
  employeeCount: number;
  headcountAllocation: number | null;
  headcountUsage: number;
}

export interface DepartmentHierarchyNode {
  unit: DepartmentUnit;
  children: DepartmentHierarchyNode[];
  employeeCount: number;
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function normalizeDepartmentUnit(record: Record<string, unknown> & { id: string }): DepartmentUnit {
  const unitType = text(record.unitType, 'unit') as OrganizationUnitType;
  return {
    id: record.id,
    name: text(record.name, 'Unnamed unit'),
    code: text(record.code),
    division: text(record.division, 'General'),
    department: text(record.department, 'General'),
    section: text(record.section, 'General'),
    unitType: ['division', 'department', 'section', 'unit'].includes(unitType) ? unitType : 'unit',
    parentId: typeof record.parentId === 'string' && record.parentId ? record.parentId : null,
    sortOrder: Number(record.sortOrder || 0),
    description: text(record.description),
    isActive: record.isActive === true || record.isActive === 'true',
    employeeCount: Number(record.employeeCount || 0),
    headcountAllocation: record.headcountAllocation === null || record.headcountAllocation === undefined || record.headcountAllocation === ''
      ? null
      : Number(record.headcountAllocation),
    headcountUsage: Number(record.headcountUsage || 0),
  };
}

export function filterDepartmentUnits(
  units: DepartmentUnit[],
  query: string,
  status: 'all' | 'active' | 'inactive',
) {
  const normalizedQuery = query.trim().toLowerCase();
  const directlyMatching = new Set(units.filter(unit => {
    const matchesStatus = status === 'all'
      || (status === 'active' ? unit.isActive : !unit.isActive);
    const matchesQuery = !normalizedQuery || [
      unit.name,
      unit.code,
      unit.division,
      unit.department,
      unit.section,
      unit.description,
      unit.unitType,
    ].some(value => value.toLowerCase().includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  }).map(unit => unit.id));

  if (!normalizedQuery && status === 'all') return units;

  const byId = new Map(units.map(unit => [unit.id, unit]));
  for (const id of [...directlyMatching]) {
    let parentId = byId.get(id)?.parentId;
    while (parentId) {
      directlyMatching.add(parentId);
      parentId = byId.get(parentId)?.parentId;
    }
  }
  return units.filter(unit => directlyMatching.has(unit.id));
}

export function buildDepartmentHierarchy(units: DepartmentUnit[]): DepartmentHierarchyNode[] {
  const nodes = new Map<string, DepartmentHierarchyNode>(
    units.map(unit => [unit.id, { unit, children: [], employeeCount: unit.employeeCount }]),
  );
  const roots: DepartmentHierarchyNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.unit.parentId ? nodes.get(node.unit.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const finalize = (node: DepartmentHierarchyNode): DepartmentHierarchyNode => {
    node.children.sort(compareHierarchyNodes).forEach(finalize);
    node.employeeCount = node.unit.employeeCount
      + node.children.reduce((total, child) => total + child.employeeCount, 0);
    return node;
  };
  return roots.sort(compareHierarchyNodes).map(finalize);
}

export function flattenDepartmentHierarchy(nodes: DepartmentHierarchyNode[]) {
  const flattened: DepartmentHierarchyNode[] = [];
  const visit = (node: DepartmentHierarchyNode) => {
    flattened.push(node);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return flattened;
}

export function getDepartmentHierarchyStats(units: DepartmentUnit[]) {
  return {
    divisions: units.filter(unit => unit.unitType === 'division').length,
    departments: units.filter(unit => unit.unitType === 'department').length,
    sections: units.filter(unit => unit.unitType === 'section').length,
    employees: units.reduce((total, unit) => total + unit.employeeCount, 0),
  };
}

function compareHierarchyNodes(left: DepartmentHierarchyNode, right: DepartmentHierarchyNode) {
  return left.unit.sortOrder - right.unit.sortOrder || left.unit.name.localeCompare(right.unit.name);
}
