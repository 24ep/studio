export const TEXT_FILTER_KEYS = [
  "name",
  "email",
  "phone",
  "location",
  "skills",
] as const;

export const ARRAY_FILTER_KEYS = [
  "selectedPositionIds",
  "selectedStatuses",
  "selectedRecruiterIds",
  "selectedSourceIds",
] as const;

export const NUMERIC_FILTER_KEYS = [
  "minExperienceYears",
  "maxExperienceYears",
] as const;

export const SIGNIFICANT_SCALAR_FILTER_KEYS = [
  ...TEXT_FILTER_KEYS,
  "education",
  ...NUMERIC_FILTER_KEYS,
  "applicationDateStart",
  "applicationDateEnd",
] as const;
