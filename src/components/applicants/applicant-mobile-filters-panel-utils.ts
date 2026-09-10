import type { ApplicantCustomFieldFilterValue } from "@/lib/types";

export function updateExperienceMinimum(
  range: [number, number],
  rawValue: string
): [number, number] {
  return [Number(rawValue) || 0, range[1]];
}

export function updateExperienceMaximum(
  range: [number, number],
  rawValue: string
): [number, number] {
  return [range[0], Number(rawValue) || 0];
}

export function updateCustomFieldFilters(
  filters: Record<string, ApplicantCustomFieldFilterValue>,
  fieldCode: string,
  value: ApplicantCustomFieldFilterValue
) {
  return {
    ...filters,
    [fieldCode]: value,
  };
}
