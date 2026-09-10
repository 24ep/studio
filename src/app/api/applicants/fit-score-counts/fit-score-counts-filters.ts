import {
  createFilterState,
  toWhereClause,
  type FitScoreCountsWhereClause,
  type QueryClient,
} from './fit-score-counts-filter-state';
import { appendFitScoreAdvancedFilters } from './fit-score-counts-advanced-filters';
import { appendFitScoreSelectionFilters } from './fit-score-counts-selection-filters';

export type { FitScoreCountsWhereClause, QueryClient };

export async function buildFitScoreCountsWhereClause(
  client: QueryClient,
  searchParams: URLSearchParams
): Promise<FitScoreCountsWhereClause> {
  const state = createFilterState();

  await appendFitScoreSelectionFilters(state, client, searchParams);
  appendFitScoreAdvancedFilters(state, searchParams);

  return toWhereClause(state);
}
