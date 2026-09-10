"use client";

import {
  DocumentTextIcon as FileText,
  ExclamationTriangleIcon as AlertTriangle,
  PlayIcon as Play,
  FunnelIcon as FilterX,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { ApplicantAdvancedQueryHistory } from './ApplicantAdvancedQueryHistory';
import { ApplicantAdvancedQueryCommands } from './applicant-advanced-query-commands';
import { validateAdvancedQuery } from './applicant-filter-query-utils';

interface ApplicantAdvancedQueryPanelProps {
  query: string;
  advancedQuery?: string;
  validationError: string | null;
  queryHistory: string[];
  showQueryHistory: boolean;
  onQueryChange: (query: string) => void;
  onValidationErrorChange: (error: string | null) => void;
  onApplyQuery: (query: string) => void;
  onClear: () => void;
  onOpenSyntax: () => void;
  onToggleQueryHistory: () => void;
  onRemoveHistoryQuery: (index: number) => void;
}

export function ApplicantAdvancedQueryPanel({
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
}: ApplicantAdvancedQueryPanelProps) {
  const handleQueryChange = (nextQuery: string) => {
    onQueryChange(nextQuery);
    const validation = validateAdvancedQuery(nextQuery);
    onValidationErrorChange(validation.isValid ? null : validation.error || null);
  };

  const handleValidateAndApply = (queryToApply = query) => {
    const validation = validateAdvancedQuery(queryToApply);
    if (validation.isValid) {
      onApplyQuery(queryToApply);
    } else {
      onValidationErrorChange(validation.error || null);
    }
  };

  const handlePresetQuery = (presetQuery: string) => {
    onQueryChange(presetQuery);
    onValidationErrorChange(null);
    onApplyQuery(presetQuery);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2 m-4">
          <Label className="text-xs font-medium">Advanced Query Syntax</Label>
          <Button
            variant="ghost"
            size="icon"
            className="p-1 h-6 w-6"
            type="button"
            onClick={onOpenSyntax}
          >
            <FileText className="w-4 h-4 text-blue-600" />
          </Button>
        </div>
        <div className="flex gap-2 px-4">
          <div className="flex-1">
            <Textarea
              placeholder="e.g., minAppliedJobFitScore:80 status:Applied,Screening"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) return;
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (query.trim()) handleValidateAndApply();
                }
                if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  onOpenSyntax();
                }
                if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  onToggleQueryHistory();
                }
                if (event.key === 'Backspace' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  onClear();
                }
              }}
              className={cn(
                "flex-1 min-h-[80px]",
                validationError && "border-red-500 focus:border-red-500"
              )}
            />
            {validationError && (
              <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Query Error</span>
                </div>
                <p>{validationError}</p>
              </div>
            )}
          </div>
        </div>

        <ApplicantAdvancedQueryCommands onSelectQuery={handlePresetQuery} />

        <ApplicantAdvancedQueryHistory
          queryHistory={queryHistory}
          showQueryHistory={showQueryHistory}
          onSelectQuery={handlePresetQuery}
          onToggleQueryHistory={onToggleQueryHistory}
          onRemoveHistoryQuery={onRemoveHistoryQuery}
        />

        <div className="flex gap-2 pt-2 mx-4">
          <Button
            onClick={() => handleValidateAndApply()}
            disabled={!query.trim() || !!validationError}
            className="flex-1"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            {validationError ? 'Fix Query' : 'Apply Query'}
          </Button>
          <Button
            variant="outline"
            onClick={onClear}
            disabled={!query.trim() && !advancedQuery?.trim()}
            className="flex-1"
            size="sm"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
