import { ApplicantsTab } from './ApplicantsTab';
import type { ApplicantsPanelProps } from './PositionDetailDrawerTabPanelTypes';

export function PositionApplicantsPanel(props: ApplicantsPanelProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ApplicantsTab
        isMobile={props.isMobile}
        isJobMatchEnabled={props.isJobMatchEnabled}
        activeApplicantTab={props.activeApplicantTab as 'applied' | 'potential'}
        onActiveApplicantTabChange={props.onActiveApplicantTabChange}
        appliedApplicants={props.appliedApplicants}
        sortedAppliedApplicants={props.sortedAppliedApplicants}
        appliedApplicantsSearchTerm={props.appliedApplicantsSearchTerm}
        appliedApplicantsSortColumn={props.appliedApplicantsSortColumn}
        appliedApplicantsSortDirection={props.appliedApplicantsSortDirection}
        appliedApplicantsOpenMenu={props.appliedApplicantsOpenMenu}
        appliedApplicantsPage={props.appliedApplicantsPage}
        appliedApplicantsPageSize={props.appliedApplicantsPageSize}
        appliedApplicantsTotal={props.appliedApplicantsTotal}
        appliedApplicantsCount={props.appliedApplicantsCount}
        onAppliedApplicantsSearchChange={props.onAppliedApplicantsSearchChange}
        onAppliedApplicantsSort={props.onAppliedApplicantsSort}
        onAppliedApplicantsOpenMenuChange={props.onAppliedApplicantsOpenMenuChange}
        onAppliedApplicantsPageChange={props.onAppliedApplicantsPageChange}
        onAppliedApplicantsPageSizeChange={props.onAppliedApplicantsPageSizeChange}
        onAppliedApplicantPinToggle={props.onAppliedApplicantPinToggle}
        potentialApplicants={props.potentialApplicants}
        sortedPotentialApplicants={props.sortedPotentialApplicants}
        potentialApplicantsSearchTerm={props.potentialApplicantsSearchTerm}
        potentialApplicantsSortColumn={props.potentialApplicantsSortColumn}
        potentialApplicantsSortDirection={props.potentialApplicantsSortDirection}
        potentialApplicantsOpenMenu={props.potentialApplicantsOpenMenu}
        potentialApplicantsPage={props.potentialApplicantsPage}
        potentialApplicantsPageSize={props.potentialApplicantsPageSize}
        potentialApplicantsTotal={props.potentialApplicantsTotal}
        onPotentialApplicantsSearchChange={props.onPotentialApplicantsSearchChange}
        onPotentialApplicantsSort={props.onPotentialApplicantsSort}
        onPotentialApplicantsOpenMenuChange={props.onPotentialApplicantsOpenMenuChange}
        onPotentialApplicantsPageChange={props.onPotentialApplicantsPageChange}
        onPotentialApplicantsPageSizeChange={props.onPotentialApplicantsPageSizeChange}
        onPotentialApplicantPinToggle={props.onPotentialApplicantPinToggle}
        stageNames={props.stageNames}
        onApplicantClick={props.onApplicantClick}
        applicantFilters={props.applicantFilters}
        onFilterChange={props.onApplicantFilterChange}
        onAiSearch={props.onAiSearch}
        isAiSearching={props.isAiSearchingApplicants}
        onClearFilters={props.onClearFilters}
        availableRecruiters={props.availableRecruiters}
        availableStages={props.recruitmentStages}
        availableSources={props.availableSources}
        availablePositions={[props.position!]}
      />
    </div>
  );
}
