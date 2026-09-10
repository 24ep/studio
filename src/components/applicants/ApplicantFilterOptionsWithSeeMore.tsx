"use client";

import { CheckIcon as Check } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  getVisibleApplicantFilterOptions,
  type ApplicantFilterOption,
} from './applicant-filter-query-utils';

interface ApplicantFilterOptionsWithSeeMoreProps {
  options: ApplicantFilterOption[];
  selectedIds: Set<string>;
  attributeKey: string;
  isExpanded: boolean;
  onToggleOption: (id: string) => void;
  onToggleExpanded: (attributeKey: string) => void;
  maxVisible?: number;
}

export function ApplicantFilterOptionsWithSeeMore({
  options,
  selectedIds,
  attributeKey,
  isExpanded,
  onToggleOption,
  onToggleExpanded,
  maxVisible = 5,
}: ApplicantFilterOptionsWithSeeMoreProps) {
  const { visibleOptions, hasMore, remainingCount } = getVisibleApplicantFilterOptions(
    options,
    isExpanded,
    maxVisible
  );

  return (
    <div className="space-y-2">
      {visibleOptions.map((option) => {
        const isSelected = selectedIds.has(option.id);

        return (
          <div key={option.id} className="flex items-center space-x-2 py-1">
            <Checkbox
              id={`${attributeKey}-${option.id}`}
              checked={isSelected}
              onCheckedChange={() => onToggleOption(option.id)}
            />
            <Label
              htmlFor={`${attributeKey}-${option.id}`}
              className={cn(
                "text-sm font-normal cursor-pointer flex-1 flex items-center justify-between",
                isSelected && "font-medium text-primary"
              )}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="h-4 w-4 text-green-500 ml-2" />}
            </Label>
          </div>
        );
      })}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-sm text-primary"
          onClick={() => onToggleExpanded(attributeKey)}
        >
          {isExpanded ? 'See less' : `See more (${remainingCount} more)`}
        </Button>
      )}
    </div>
  );
}
