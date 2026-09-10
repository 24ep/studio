import { parseAdvancedQueryEntries } from '../../../../lib/applicantAdvancedQuery';

type AdvancedFilters = Record<string, string | null>;
type FilterState = {
  conditions: string[];
  params: unknown[];
};
type AdvancedFilterKey = keyof AdvancedFilters;
type SearchParamKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'positionId'
  | 'status'
  | 'education'
  | 'minAppliedJobFitScore'
  | 'maxAppliedJobFitScore'
  | 'applicationDateStart'
  | 'applicationDateEnd'
  | 'recruiterId';

const ADVANCED_FILTER_ALIASES: Record<string, AdvancedFilterKey> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  skills: 'skills',
  location: 'location',
  status: 'status',
  education: 'education',
  position: 'positionId',
  positionid: 'positionId',
  recruiter: 'recruiterId',
  recruiterid: 'recruiterId',
  applicationdatestart: 'applicationDateStart',
  applicationdateend: 'applicationDateEnd',
  minfitscore: 'minAppliedJobFitScore',
  minappliedjobfitscore: 'minAppliedJobFitScore',
  maxfitscore: 'maxAppliedJobFitScore',
  maxappliedjobfitscore: 'maxAppliedJobFitScore',
  minmatchingjobfitscore: 'minMatchingJobFitScore',
  maxmatchingjobfitscore: 'maxMatchingJobFitScore',
  selectedsourceids: 'selectedSourceIds',
  minexperienceyears: 'minExperienceYears',
  maxexperienceyears: 'maxExperienceYears',
};

const TEXT_FILTERS: Array<{ column: string; key: SearchParamKey; advancedKey?: AdvancedFilterKey }> = [
  { column: 'c.name', key: 'name', advancedKey: 'name' },
  { column: 'c.email', key: 'email', advancedKey: 'email' },
  { column: 'c.phone', key: 'phone', advancedKey: 'phone' },
  { column: 'c."parsedData"->>\'education\'', key: 'education' },
];

const UUID_LIST_FILTERS: Array<{ column: string; key: SearchParamKey; advancedKey?: AdvancedFilterKey }> = [
  { column: 'c."positionId"', key: 'positionId', advancedKey: 'positionId' },
  { column: 'c."statusId"', key: 'status', advancedKey: 'status' },
  { column: 'c."recruiterId"', key: 'recruiterId', advancedKey: 'recruiterId' },
];

const FIT_SCORE_FILTERS: Array<{
  operator: '>=' | '<=';
  key: SearchParamKey;
  advancedKey: AdvancedFilterKey;
}> = [
  { operator: '>=', key: 'minAppliedJobFitScore', advancedKey: 'minAppliedJobFitScore' },
  { operator: '<=', key: 'maxAppliedJobFitScore', advancedKey: 'maxAppliedJobFitScore' },
];

const DATE_FILTERS: Array<{ column: string; key: SearchParamKey; advancedKey: AdvancedFilterKey; operator: '>=' | '<=' }> = [
  {
    column: 'c."applicationDate"',
    key: 'applicationDateStart',
    advancedKey: 'applicationDateStart',
    operator: '>=',
  },
  {
    column: 'c."applicationDate"',
    key: 'applicationDateEnd',
    advancedKey: 'applicationDateEnd',
    operator: '<=',
  },
];

function parseAdvancedFilters(advancedQuery: string | null): AdvancedFilters {
  const advancedFilters: AdvancedFilters = {};
  if (!advancedQuery) {
    return advancedFilters;
  }

  parseAdvancedQueryEntries(advancedQuery).forEach(({ key, value }) => {
    const filterKey = ADVANCED_FILTER_ALIASES[key.toLowerCase()];
    if (filterKey) {
      advancedFilters[filterKey] = value;
    }
  });

  return advancedFilters;
}

function appendTextFilter(state: FilterState, column: string, value?: string | null) {
  if (!value) {
    return;
  }

  state.conditions.push(`${column} ILIKE $${state.params.length + 1}`);
  state.params.push(`%${value}%`);
}

function appendUuidListFilter(state: FilterState, column: string, value?: string | null) {
  if (!value) {
    return;
  }

  const values = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (values.length === 0) {
    return;
  }

  if (values.length === 1) {
    state.conditions.push(`${column} = $${state.params.length + 1}`);
    state.params.push(values[0]);
  } else {
    state.conditions.push(`${column} = ANY($${state.params.length + 1}::uuid[])`);
    state.params.push(values);
  }
}

function appendFitScoreFilter(state: FilterState, operator: '>=' | '<=', value?: string | null) {
  if (value === null || value === undefined) {
    return;
  }

  const filterValue = parseFloat(value);
  const finalValue = filterValue > 1 ? filterValue / 100 : filterValue;
  state.conditions.push(`c."fitScore" ${operator} $${state.params.length + 1}`);
  state.params.push(finalValue);
}

function appendDateFilter(state: FilterState, column: string, operator: '>=' | '<=', value?: string | null) {
  if (!value) {
    return;
  }

  state.conditions.push(`${column} ${operator} $${state.params.length + 1}`);
  state.params.push(new Date(value));
}

function getFilterValue(
  searchParams: URLSearchParams,
  advancedFilters: AdvancedFilters,
  key: SearchParamKey,
  advancedKey?: AdvancedFilterKey
) {
  return searchParams.get(key) || (advancedKey ? advancedFilters[advancedKey] : undefined);
}

export function buildApplicantsExportFilterQuery(searchParams: URLSearchParams) {
  const advancedFilters = parseAdvancedFilters(searchParams.get('query'));
  const state: FilterState = { conditions: [], params: [] };

  TEXT_FILTERS.forEach(({ column, key, advancedKey }) => {
    appendTextFilter(state, column, getFilterValue(searchParams, advancedFilters, key, advancedKey));
  });

  UUID_LIST_FILTERS.forEach(({ column, key, advancedKey }) => {
    appendUuidListFilter(state, column, getFilterValue(searchParams, advancedFilters, key, advancedKey));
  });

  FIT_SCORE_FILTERS.forEach(({ operator, key, advancedKey }) => {
    appendFitScoreFilter(state, operator, getFilterValue(searchParams, advancedFilters, key, advancedKey));
  });

  DATE_FILTERS.forEach(({ column, key, advancedKey, operator }) => {
    appendDateFilter(state, column, operator, getFilterValue(searchParams, advancedFilters, key, advancedKey));
  });

  return {
    whereClause: state.conditions.length > 0 ? `WHERE ${state.conditions.join(' AND ')}` : '',
    queryParams: state.params,
  };
}
