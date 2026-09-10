import {
  appendApplicationDateFilters,
  appendExperienceFilters,
  appendPositionFilter,
  appendScoreFilters,
  appendSkillsFilter,
  appendSourceFilter,
  appendTextFilters,
} from './applicants-route-list-basic-filters';
import { appendCustomFieldFilters } from './applicants-route-list-custom-field-filters';
import { appendStatusFilter } from './applicants-route-list-status-filters';
import { appendRecruiterFilter, appendUserVisibilityFilters } from './applicants-route-list-visibility-filters';
import {
  buildApplicantRouteWherePartsFromState,
  createApplicantRouteWhereState,
} from './applicants-route-list-where-state';
import type {
  ApplicantRouteWhereInput,
  ApplicantRouteWhereParts,
} from './applicants-route-list-where-types';

export type {
  ApplicantRouteListQueryClient,
  ApplicantRouteListUser,
  ApplicantRouteWhereInput,
  ApplicantRouteWhereParts,
} from './applicants-route-list-where-types';

export async function buildApplicantRouteWhereParts({
  client,
  filters,
  pinnedOnly,
  user,
  hasPermission,
  readSystemSetting,
}: ApplicantRouteWhereInput): Promise<ApplicantRouteWhereParts> {
  const state = createApplicantRouteWhereState();

  appendTextFilters(state, filters);
  await appendStatusFilter(state, client, filters.status);
  appendPositionFilter(state, filters);
  appendRecruiterFilter(state, filters.recruiterId);
  await appendUserVisibilityFilters({
    state,
    filters,
    user,
    hasPermission,
    readSystemSetting,
  });
  appendSourceFilter(state, filters);
  appendScoreFilters(state, filters);
  appendExperienceFilters(state, filters);
  appendApplicationDateFilters(state, filters);
  appendSkillsFilter(state, filters.skills);
  await appendCustomFieldFilters(state, client, filters);

  if (pinnedOnly) {
    state.whereClauses.push(`c."isPinned" = true`);
  }

  return buildApplicantRouteWherePartsFromState(state);
}
