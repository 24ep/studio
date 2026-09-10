import { usePositionsPageFetchEffect } from './use-positions-page-fetch-effect';
import { usePositionsPageLoadingEffects } from './use-positions-page-loading-effects';
import { usePositionsPageReferenceEffects } from './use-positions-page-reference-effects';
import { usePositionsPageSyncEffects } from './use-positions-page-sync-effects';
import type { UsePositionsPageEffectsInput } from './use-positions-page-effects-types';

export function usePositionsPageEffects(input: UsePositionsPageEffectsInput) {
  usePositionsPageSyncEffects(input);
  usePositionsPageLoadingEffects(input);
  usePositionsPageReferenceEffects(input);
  usePositionsPageFetchEffect(input);
}
