"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { StatusMultiSelectDropdown } from '@/components/applicants/StatusMultiSelectDropdown';
import { SourceMultiSelectDropdown } from '@/components/applicants/SourceMultiSelectDropdown';
import { RecruiterMultiSelectDropdown } from '@/components/applicants/RecruiterMultiSelectDropdown';
import type { ApplicantFilterValues, RecruitmentStage, ApplicantSource, UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PositionApplicantFilterProps {
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  availableStages: RecruitmentStage[];
  availableSources: ApplicantSource[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
}

export function PositionApplicantFilter({
  filters,
  onFilterChange,
  availableStages,
  availableSources,
  availableRecruiters
}: PositionApplicantFilterProps) {
  const [open, setOpen] = useState(false);

  // Local state for the form
  const [localFilters, setLocalFilters] = useState<ApplicantFilterValues>(filters);

  // Update local state when prop changes (external change)
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const emptyFilters: ApplicantFilterValues = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setOpen(false);
  };

  // Calculate active filter count
  const activeCount = [
    localFilters.name,
    localFilters.email,
    localFilters.phone,
    (localFilters.selectedStatuses?.length || 0) > 0,
    (localFilters.selectedSourceIds?.length || 0) > 0,
    // Add other filter checks as needed
  ].filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Filter Applicants</h4>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator />

          <div className="space-y-4">
            {/* Search inputs */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={localFilters.name || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, name: e.target.value })}
                placeholder="Search by name"
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <StatusMultiSelectDropdown
                selectedIds={new Set(localFilters.selectedStatuses || [])}
                onSelectionChange={(ids: Set<string>) => setLocalFilters({ ...localFilters, selectedStatuses: Array.from(ids) })}
                stages={availableStages}
              />
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <SourceMultiSelectDropdown
                selectedSourceIds={new Set(localFilters.selectedSourceIds || [])}
                onSelectionChange={(ids: Set<string>) => setLocalFilters({ ...localFilters, selectedSourceIds: Array.from(ids) })}
                availableSources={availableSources}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="p-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear all
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
