import { buildApplicantRouteCustomFieldConditions } from './applicants-route-utils';
import { appendSqlConditionResult } from './applicants-route-list-where-state';
import type {
  ApplicantRouteCustomFieldDefinition,
  ApplicantRouteFilters,
} from './applicants-route-query-types';
import type { ApplicantRouteListQueryClient, ApplicantRouteWhereState } from './applicants-route-list-where-types';

export async function appendCustomFieldFilters(
  state: ApplicantRouteWhereState,
  client: ApplicantRouteListQueryClient,
  filters: ApplicantRouteFilters
) {
  if (!filters.customFieldFilters || Object.keys(filters.customFieldFilters).length === 0) {
    return;
  }

  const customFieldDefsResult = await client.query(`
    SELECT field_code, field_type, options
    FROM "CustomFieldDefinition"
    WHERE model_name = 'Applicant' AND show_in_filter = true
  `);
  const customFieldDefs = customFieldDefsResult.rows.reduce((acc, row) => {
    acc[row.field_code] = row as ApplicantRouteCustomFieldDefinition;
    return acc;
  }, {} as Record<string, ApplicantRouteCustomFieldDefinition>);

  appendSqlConditionResult(state, buildApplicantRouteCustomFieldConditions({
    customFieldFilters: filters.customFieldFilters,
    customFieldDefinitions: customFieldDefs,
    paramIndex: state.paramIndex,
  }));
}
