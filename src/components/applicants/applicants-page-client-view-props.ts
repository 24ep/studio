import type { ApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';
import {
  buildHeaderProps,
  buildMobileFilterProps,
  buildMobileFitScoreProps,
  buildModalsProps,
  buildPinnedFilterProps,
  buildSearchExperienceProps,
  buildTableAreaProps,
} from './applicants-page-client-view-prop-builders';

export function buildApplicantsPageClientViewProps(controller: ApplicantsPageClientController) {
  return {
    isMobile: controller.layout.isMobile,
    isFilterPinned: controller.layout.isFilterPinned,
    mobileFitScoreProps: buildMobileFitScoreProps(controller),
    pinnedFilterProps: buildPinnedFilterProps(controller),
    headerProps: buildHeaderProps(controller),
    tableAreaProps: buildTableAreaProps(controller),
    modalsProps: buildModalsProps(controller),
    mobileFilterProps: buildMobileFilterProps(controller),
    searchExperienceProps: buildSearchExperienceProps(controller),
  };
}
