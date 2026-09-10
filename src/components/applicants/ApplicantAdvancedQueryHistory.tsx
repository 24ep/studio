"use client";

import {
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  ClockIcon as Clock,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ApplicantAdvancedQueryHistoryProps {
  queryHistory: string[];
  showQueryHistory: boolean;
  onSelectQuery: (query: string) => void;
  onToggleQueryHistory: () => void;
  onRemoveHistoryQuery: (index: number) => void;
}

export function ApplicantAdvancedQueryHistory({
  queryHistory,
  showQueryHistory,
  onSelectQuery,
  onToggleQueryHistory,
  onRemoveHistoryQuery,
}: ApplicantAdvancedQueryHistoryProps) {
  if (queryHistory.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-xs font-medium text-muted-foreground">Recent Queries</Label>
        <div className="flex-1 h-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onToggleQueryHistory}
        >
          {showQueryHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>
      {showQueryHistory && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {queryHistory.map((historyQuery, index) => (
            <div
              key={`${historyQuery}-${index}`}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs hover:bg-muted/50"
            >
              <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <button
                type="button"
                className="flex-1 truncate text-left text-blue-600"
                onClick={() => onSelectQuery(historyQuery)}
              >
                <code>{historyQuery}</code>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
                onClick={() => onRemoveHistoryQuery(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
