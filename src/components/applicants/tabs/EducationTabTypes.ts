export type ApplicantFormArrayField = {
  id?: string;
  field_id?: string;
};

export type EducationDisplayEntry = {
  university?: string | null;
  major?: string | null;
  field?: string | null;
  campus?: string | null;
  GPA?: string | number | null;
  fitScore?: string | number | null;
  startMonth?: unknown;
  startYear?: unknown;
  endMonth?: unknown;
  endYear?: unknown;
  isCurrent?: unknown;
};
