import { parseISO } from 'date-fns';

import type { ApplicantFilterValues } from '@/lib/types';
import { parseAdvancedQueryEntries } from './applicant-advanced-query-entry-utils';

type TextFilterField = 'name' | 'email' | 'phone' | 'skills' | 'location';
type ListFilterField = 'selectedPositionIds' | 'selectedStatuses' | 'selectedRecruiterIds' | 'selectedSourceIds';
type IntegerFilterField = 'minExperienceYears' | 'maxExperienceYears';
type PercentFilterField =
  | 'minAppliedJobFitScore'
  | 'maxAppliedJobFitScore'
  | 'minMatchingJobFitScore'
  | 'maxMatchingJobFitScore';
type DateFilterField = 'applicationDateStart' | 'applicationDateEnd';

const TEXT_FILTER_FIELDS: Record<string, TextFilterField> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  skills: 'skills',
  location: 'location',
};

const LIST_FILTER_FIELDS: Record<string, { field: ListFilterField; trimValues?: boolean }> = {
  positionid: { field: 'selectedPositionIds' },
  status: { field: 'selectedStatuses', trimValues: true },
  recruiterid: { field: 'selectedRecruiterIds' },
  selectedsourceids: { field: 'selectedSourceIds' },
};

const INTEGER_FILTER_FIELDS: Record<string, IntegerFilterField> = {
  minexperienceyears: 'minExperienceYears',
  maxexperienceyears: 'maxExperienceYears',
};

const PERCENT_FILTER_FIELDS: Record<string, PercentFilterField> = {
  minfitscore: 'minAppliedJobFitScore',
  minappliedjobfitscore: 'minAppliedJobFitScore',
  maxfitscore: 'maxAppliedJobFitScore',
  maxappliedjobfitscore: 'maxAppliedJobFitScore',
  matchingfitscoremin: 'minMatchingJobFitScore',
  minmatchingjobfitscore: 'minMatchingJobFitScore',
  matchingfitscoremax: 'maxMatchingJobFitScore',
  maxmatchingjobfitscore: 'maxMatchingJobFitScore',
};

const DATE_FILTER_FIELDS: Record<string, DateFilterField> = {
  applicationdatestart: 'applicationDateStart',
  applicationdateend: 'applicationDateEnd',
};

export function parseAdvancedQuery(query: string): Partial<ApplicantFilterValues> {
  const filters: Partial<ApplicantFilterValues> = {};

  parseAdvancedQueryEntries(query).forEach(({ key, value }) => {
    applyAdvancedQueryEntry(filters, key.toLowerCase(), value);
  });

  return filters;
}

function applyAdvancedQueryEntry(
  filters: Partial<ApplicantFilterValues>,
  key: string,
  value: string,
) {
  if (applyTextFilter(filters, key, value)) return;
  if (applyListFilter(filters, key, value)) return;
  if (applyIntegerQueryFilter(filters, key, value)) return;
  if (applyPercentQueryFilter(filters, key, value)) return;
  if (applyDateQueryFilter(filters, key, value)) return;

  if (key === 'matchingfitscore') {
    const parsedValue = parsePercentFilter(value);
    if (parsedValue !== null) {
      filters.minMatchingJobFitScore = parsedValue;
      filters.maxMatchingJobFitScore = 1;
    }
    return;
  }

  if (key === 'locationoperator') {
    filters.locationOperator = value as ApplicantFilterValues['locationOperator'];
  }
}

function applyTextFilter(filters: Partial<ApplicantFilterValues>, key: string, value: string) {
  const field = TEXT_FILTER_FIELDS[key];
  if (!field) return false;

  filters[field] = value;
  return true;
}

function applyListFilter(filters: Partial<ApplicantFilterValues>, key: string, value: string) {
  const config = LIST_FILTER_FIELDS[key];
  if (!config) return false;

  const values = value.split(',');
  filters[config.field] = config.trimValues ? values.map((item) => item.trim()) : values;
  return true;
}

function applyIntegerQueryFilter(filters: Partial<ApplicantFilterValues>, key: string, value: string) {
  const field = INTEGER_FILTER_FIELDS[key];
  if (!field) return false;

  const parsedValue = parseIntegerFilter(value);
  if (parsedValue !== null) {
    filters[field] = parsedValue;
  }
  return true;
}

function applyPercentQueryFilter(filters: Partial<ApplicantFilterValues>, key: string, value: string) {
  const field = PERCENT_FILTER_FIELDS[key];
  if (!field) return false;

  const parsedValue = parsePercentFilter(value);
  if (parsedValue !== null) {
    filters[field] = parsedValue;
  }
  return true;
}

function applyDateQueryFilter(filters: Partial<ApplicantFilterValues>, key: string, value: string) {
  const field = DATE_FILTER_FIELDS[key];
  if (!field) return false;

  const date = parseDateFilter(value);
  if (date) {
    filters[field] = date;
  }
  return true;
}

function parseIntegerFilter(value: string) {
  const parsedValue = parseInt(value, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function parsePercentFilter(value: string) {
  const parsedValue = parseIntegerFilter(value);
  return parsedValue === null ? null : parsedValue / 100;
}

function parseDateFilter(value: string) {
  try {
    const date = parseISO(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    console.error('Error parsing advanced query date:', value, error);
  }
  return null;
}
