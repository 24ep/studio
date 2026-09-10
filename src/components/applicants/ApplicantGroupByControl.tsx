"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPLICANT_GROUP_BY_OPTIONS } from './applicant-grouping-utils';
import type { ApplicantGroupBy } from './applicant-settings-types';

interface ApplicantGroupByControlProps {
  groupBy: ApplicantGroupBy;
  onGroupByChange: (groupBy: ApplicantGroupBy) => Promise<void>;
  className?: string;
}

export function ApplicantGroupByControl({
  groupBy,
  onGroupByChange,
  className,
}: ApplicantGroupByControlProps) {
  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">Group by</span>
      <Select
        value={groupBy}
        onValueChange={(value) => {
          void onGroupByChange(value as ApplicantGroupBy);
        }}
      >
        <SelectTrigger className="h-9 w-40 bg-background">
          <SelectValue placeholder="Group by" />
        </SelectTrigger>
        <SelectContent selectId="applicant-group-by-select">
          {APPLICANT_GROUP_BY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
