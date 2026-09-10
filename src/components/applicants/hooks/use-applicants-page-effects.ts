import { useApplicantsPageBootstrapEffects } from './use-applicants-page-bootstrap-effects';
import type { UseApplicantsPageEffectsInput } from './use-applicants-page-effects-types';
import { useApplicantsPageLiveEffects } from './use-applicants-page-live-effects';

export function useApplicantsPageEffects(props: UseApplicantsPageEffectsInput) {
  useApplicantsPageBootstrapEffects(props);
  useApplicantsPageLiveEffects(props);
}
