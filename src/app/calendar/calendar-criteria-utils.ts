const EVALUATION_CRITERIA_KEYS = [
  'personalityTraits',
  'personalityGroups',
  'expertiseSkills',
  'expertiseGroups',
];

export function hasEvaluationCriteriaSkills(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const criteria = payload as Record<string, unknown>;
  return EVALUATION_CRITERIA_KEYS.some(
    (key) =>
      Array.isArray(criteria[key]) && (criteria[key] as unknown[]).length > 0,
  );
}
