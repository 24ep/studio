import {
  appendCondition,
  type FilterState,
} from './fit-score-counts-filter-state';

interface NullableSelectionConditions {
  nullCondition: string;
  singleCondition: (placeholder: string) => string;
  arrayCondition: (placeholder: string) => string;
  nullOrSingleCondition?: (placeholder: string) => string;
  nullOrArrayCondition: (placeholder: string) => string;
}

export function appendNullableSelectionFilter(
  state: FilterState,
  selectedValues: string[],
  conditions: NullableSelectionConditions
) {
  if (selectedValues.length === 0 || selectedValues.includes('select-all')) {
    return;
  }

  const hasUnassigned = selectedValues.includes('unassigned');
  const assignedValues = selectedValues.filter(value => value !== 'unassigned');

  if (hasUnassigned && assignedValues.length === 0) {
    state.whereClauses.push(conditions.nullCondition);
    return;
  }

  if (hasUnassigned) {
    appendAssignedWithNullCondition(state, assignedValues, conditions);
    return;
  }

  appendAssignedOnlyCondition(state, assignedValues, conditions);
}

function appendAssignedWithNullCondition(
  state: FilterState,
  assignedValues: string[],
  conditions: NullableSelectionConditions
) {
  const placeholder = `$${state.paramIndex++}`;
  const condition = assignedValues.length === 1 && conditions.nullOrSingleCondition
    ? conditions.nullOrSingleCondition(placeholder)
    : conditions.nullOrArrayCondition(placeholder);
  const value = assignedValues.length === 1 && conditions.nullOrSingleCondition
    ? assignedValues[0]
    : assignedValues;

  appendCondition(state, condition, [value]);
}

function appendAssignedOnlyCondition(
  state: FilterState,
  assignedValues: string[],
  conditions: NullableSelectionConditions
) {
  if (assignedValues.length === 0) {
    return;
  }

  const placeholder = `$${state.paramIndex++}`;
  const condition = assignedValues.length === 1
    ? conditions.singleCondition(placeholder)
    : conditions.arrayCondition(placeholder);
  const value = assignedValues.length === 1 ? assignedValues[0] : assignedValues;

  appendCondition(state, condition, [value]);
}
