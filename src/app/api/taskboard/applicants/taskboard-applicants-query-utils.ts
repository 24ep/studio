import type { TaskboardQueryParts } from './taskboard-applicants-types';

interface NullableSelectionConditions {
  arrayCondition: (placeholder: string) => string;
  nullCondition: string;
  nullOrArrayCondition: (placeholder: string) => string;
}

export function appendTaskboardCondition(
  parts: TaskboardQueryParts,
  condition: string,
  values: unknown[] = [],
) {
  parts.whereClauses.push(condition);
  parts.queryParams.push(...values);
}

export function getTaskboardPlaceholder(parts: TaskboardQueryParts) {
  return `$${parts.paramIndex++}`;
}

export function appendTaskboardSingleOrArrayFilter(
  parts: TaskboardQueryParts,
  columnName: string,
  values: string[],
) {
  if (values.length === 0) {
    return;
  }

  const placeholder = getTaskboardPlaceholder(parts);
  const condition = values.length === 1
    ? `${columnName} = ${placeholder}`
    : `${columnName} = ANY(${placeholder}::uuid[])`;
  const value = values.length === 1 ? values[0] : values;

  appendTaskboardCondition(parts, condition, [value]);
}

export function appendTaskboardNullableSelectionFilter(
  parts: TaskboardQueryParts,
  selectedValues: string[],
  conditions: NullableSelectionConditions,
) {
  if (selectedValues.length === 0 || selectedValues.includes('select-all')) {
    return;
  }

  const assignedValues = selectedValues.filter((id) => id !== 'unassigned');
  const hasUnassigned = selectedValues.includes('unassigned');

  if (hasUnassigned && assignedValues.length === 0) {
    appendTaskboardCondition(parts, conditions.nullCondition);
    return;
  }

  if (hasUnassigned) {
    const placeholder = getTaskboardPlaceholder(parts);
    appendTaskboardCondition(parts, conditions.nullOrArrayCondition(placeholder), [assignedValues]);
    return;
  }

  appendTaskboardCondition(
    parts,
    conditions.arrayCondition(getTaskboardPlaceholder(parts)),
    [assignedValues],
  );
}

export function appendTaskboardMappedStatusFilter(
  parts: TaskboardQueryParts,
  value: string | null,
  conditionByValue: Record<string, string>,
) {
  const condition = value ? conditionByValue[value] : undefined;
  if (condition) {
    appendTaskboardCondition(parts, condition);
  }
}
