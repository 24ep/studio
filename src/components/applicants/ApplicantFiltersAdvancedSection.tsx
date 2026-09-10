"use client";

import { ApplicantAdvancedQueryPanel } from './ApplicantAdvancedQueryPanel';

interface ApplicantFiltersAdvancedSectionProps {
  query: string;
  advancedQuery?: string;
  validationError: string | null;
  queryHistory: string[];
  showQueryHistory: boolean;
  onQueryChange: (query: string) => void;
  onValidationErrorChange: (error: string | null) => void;
  onApplyQuery: () => void;
  onClear: () => void;
  onOpenSyntax: () => void;
  onToggleQueryHistory: () => void;
  onRemoveHistoryQuery: (index: number) => void;
  mobilePadding?: boolean;
}

export function ApplicantFiltersAdvancedSection({
  query,
  advancedQuery,
  validationError,
  queryHistory,
  showQueryHistory,
  onQueryChange,
  onValidationErrorChange,
  onApplyQuery,
  onClear,
  onOpenSyntax,
  onToggleQueryHistory,
  onRemoveHistoryQuery,
  mobilePadding = false,
}: ApplicantFiltersAdvancedSectionProps) {
  const panel = (
    <ApplicantAdvancedQueryPanel
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
    />
  );

  return mobilePadding ? <div className="pb-24">{panel}</div> : panel;
}
