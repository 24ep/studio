import { ApplicantFiltersAdvancedSection } from './ApplicantFiltersAdvancedSection';

interface ApplicantFiltersAdvancedTabProps {
  query: string;
  advancedQuery?: string;
  validationError: string | null;
  queryHistory: string[];
  showQueryHistory: boolean;
  mobilePadding?: boolean;
  onQueryChange: (query: string) => void;
  onValidationErrorChange: (error: string | null) => void;
  onApplyQuery: () => void;
  onClear: () => void;
  onOpenSyntax: () => void;
  onToggleQueryHistory: () => void;
  onRemoveHistoryQuery: (index: number) => void;
}

export function ApplicantFiltersAdvancedTab({
  query,
  advancedQuery,
  validationError,
  queryHistory,
  showQueryHistory,
  mobilePadding,
  onQueryChange,
  onValidationErrorChange,
  onApplyQuery,
  onClear,
  onOpenSyntax,
  onToggleQueryHistory,
  onRemoveHistoryQuery,
}: ApplicantFiltersAdvancedTabProps) {
  return (
    <ApplicantFiltersAdvancedSection
      query={query}
      advancedQuery={advancedQuery}
      validationError={validationError}
      queryHistory={queryHistory}
      showQueryHistory={showQueryHistory}
      onQueryChange={onQueryChange}
      onValidationErrorChange={onValidationErrorChange}
      onApplyQuery={onApplyQuery}
      onClear={onClear}
      onOpenSyntax={onOpenSyntax}
      onToggleQueryHistory={onToggleQueryHistory}
      onRemoveHistoryQuery={onRemoveHistoryQuery}
      mobilePadding={mobilePadding}
    />
  );
}
