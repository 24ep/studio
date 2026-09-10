import { ApplicantFiltersAdvancedTab } from './ApplicantFiltersAdvancedTab';
import type { ApplicantFiltersMobileContentProps } from './ApplicantFiltersMobileContentTypes';

export function ApplicantFiltersMobileAdvancedPanel({
  activeTab,
  advancedQueryInput,
  advancedQuery,
  queryValidationError,
  queryHistory,
  showQueryHistory,
  onAdvancedQueryChange,
  onAdvancedValidationErrorChange,
  onApplyAdvancedQuery,
  onClearAdvancedQuery,
  onOpenAdvancedSyntax,
  onToggleQueryHistory,
  onRemoveHistoryQuery,
}: ApplicantFiltersMobileContentProps) {
  if (activeTab !== 'advanced') {
    return null;
  }

  return (
    <ApplicantFiltersAdvancedTab
      query={advancedQueryInput}
      advancedQuery={advancedQuery}
      validationError={queryValidationError}
      queryHistory={queryHistory}
      showQueryHistory={showQueryHistory}
      onQueryChange={onAdvancedQueryChange}
      onValidationErrorChange={onAdvancedValidationErrorChange}
      onApplyQuery={onApplyAdvancedQuery}
      onClear={onClearAdvancedQuery}
      onOpenSyntax={onOpenAdvancedSyntax}
      onToggleQueryHistory={onToggleQueryHistory}
      onRemoveHistoryQuery={onRemoveHistoryQuery}
      mobilePadding
    />
  );
}
