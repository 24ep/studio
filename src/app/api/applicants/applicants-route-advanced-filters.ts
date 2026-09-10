import { parseAdvancedQueryEntries } from '../../../lib/applicantAdvancedQuery';
import type { ApplicantRouteAdvancedFilters } from './applicants-route-query-types';

const ADVANCED_FILTER_KEY_MAP: Record<string, keyof ApplicantRouteAdvancedFilters> = {
  name: 'searchTerm',
  email: 'email',
  phone: 'phone',
  skills: 'skills',
  location: 'location',
  status: 'status',
  position: 'position',
  recruiter: 'recruiter',
  positionid: 'positionId',
  recruiterid: 'recruiterId',
  applicationdatestart: 'applicationDateStart',
  applicationdateend: 'applicationDateEnd',
  minexperienceyears: 'minExperienceYears',
  maxexperienceyears: 'maxExperienceYears',
  minfitscore: 'minAppliedJobFitScore',
  minappliedjobfitscore: 'minAppliedJobFitScore',
  maxfitscore: 'maxAppliedJobFitScore',
  maxappliedjobfitscore: 'maxAppliedJobFitScore',
  minmatchingjobfitscore: 'minMatchingJobFitScore',
  maxmatchingjobfitscore: 'maxMatchingJobFitScore',
  education: 'education',
  selectedsourceids: 'selectedSourceIds',
  locationoperator: 'locationOperator',
};

export function parseApplicantRouteAdvancedFilters(advancedQuery: string | null) {
  const advancedFilters: ApplicantRouteAdvancedFilters = {};

  if (!advancedQuery) {
    return advancedFilters;
  }

  parseAdvancedQueryEntries(advancedQuery).forEach(({ key, value }) => {
    const filterKey = ADVANCED_FILTER_KEY_MAP[key.toLowerCase()];
    if (filterKey) {
      advancedFilters[filterKey] = value;
    }
  });

  return advancedFilters;
}
