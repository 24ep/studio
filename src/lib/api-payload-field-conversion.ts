import {
  isObjectPayload,
} from './api-payload-recursive-utils';
import {
  normalizeBooleanField,
  normalizeNumberField,
} from './api-payload-scalar-utils';

const FIELDS_TO_STRINGIFY = [
  'GPA', 'startMonth', 'startYear', 'endMonth', 'endYear', 'isCurrent', 'major', 'university', 'company', 'position', 'description',
  'firstname', 'lastname', 'nickname', 'title_honorific', 'introduction_aboutme', 'location',
  'email', 'phone',
  'cv_language', 'status',
  'suitable_career', 'suitable_job_level', 'suitable_job_position', 'suitable_salary_bath_month',
  'segment_skill',
];

const FIELDS_TO_NUMBERIFY: string[] = [];
const FIELDS_TO_BOOLEANIFY: string[] = [];

function convertFieldValue(key: string, value: unknown): unknown {
  if (FIELDS_TO_STRINGIFY.includes(key)) {
    return value != null ? String(value) : '';
  }

  if (FIELDS_TO_NUMBERIFY.includes(key)) {
    return normalizeNumberField(value);
  }

  if (FIELDS_TO_BOOLEANIFY.includes(key)) {
    return normalizeBooleanField(value);
  }

  if (key === 'skill' && Array.isArray(value)) {
    return value.map((item) => typeof item === 'string' ? item : String(item));
  }

  return convertFieldsToTypes(value);
}

export function convertFieldsToTypes(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertFieldsToTypes);
  }

  if (isObjectPayload(obj)) {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = convertFieldValue(key, value);
    }
    return newObj;
  }

  return obj;
}
