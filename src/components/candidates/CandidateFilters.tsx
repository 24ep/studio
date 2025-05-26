
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// Command components removed as they are not found
// import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, ListFilter } from 'lucide-react'; // Removed Check, ChevronsUpDown
import type { Position } from '@/lib/types';
import { cn } from "@/lib/utils";

export interface CandidateFilterValues {
  name?: string;
  positionId?: string; // Will hold the ID of the selected position
  education?: string;
  minFitScore?: number;
  maxFitScore?: number;
}

interface CandidateFiltersProps {
  initialFilters?: CandidateFilterValues;
  onFilterChange: (filters: CandidateFilterValues) => void;
  availablePositions: Position[];
  isLoading?: boolean;
}

const ALL_POSITIONS_SELECT_VALUE = "__ALL_POSITIONS__";

export function CandidateFilters({ initialFilters = {}, onFilterChange, availablePositions, isLoading }: CandidateFiltersProps) {
  const [name, setName] = useState(initialFilters.name || '');
  const [positionId, setPositionId] = useState(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
  const [education, setEducation] = useState(initialFilters.education || '');
  const [fitScoreRange, setFitScoreRange] = useState<[number, number]>([
    initialFilters.minFitScore || 0,
    initialFilters.maxFitScore || 100,
  ]);
  // const [positionComboboxOpen, setPositionComboboxOpen] = useState(false); // Removed for Select

  useEffect(() => {
    setPositionId(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
    setName(initialFilters.name || '');
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
  }, [initialFilters]);

  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      positionId: positionId === ALL_POSITIONS_SELECT_VALUE ? undefined : positionId,
      education: education || undefined,
      minFitScore: fitScoreRange[0],
      maxFitScore: fitScoreRange[1],
    });
  };

  const handleResetFilters = () => {
    setName('');
    setPositionId(ALL_POSITIONS_SELECT_VALUE);
    setEducation('');
    setFitScoreRange([0, 100]);
    onFilterChange({
      positionId: undefined,
      minFitScore: 0,
      maxFitScore: 100,
    });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      {/* Comment explaining the change for future reference
          Searchable Combobox for Position filter was removed due to missing 'Command' component.
          To re-enable, run 'npx shadcn-ui@latest add command popover' and then update this component.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="name-search">Name</Label>
          <Input
            id="name-search"
            placeholder="Search by name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="position-select">Position</Label>
          <Select
            value={positionId}
            onValueChange={(value) => setPositionId(value)}
            disabled={isLoading}
          >
            <SelectTrigger id="position-select" className="w-full mt-1">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_POSITIONS_SELECT_VALUE}>All Positions</SelectItem>
              {availablePositions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="education-search">Education</Label>
          <Input
            id="education-search"
            placeholder="Filter by education..."
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label>Fit Score ({fitScoreRange[0]}% - {fitScoreRange[1]}%)</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal" disabled={isLoading}>
                <span>{fitScoreRange[0]} - {fitScoreRange[1]}%</span>
                <ListFilter className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[fitScoreRange[0], fitScoreRange[1]]}
                onValueChange={(newRange) => setFitScoreRange(newRange as [number, number])}
                className="my-4"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fitScoreRange[0]}%</span>
                <span>{fitScoreRange[1]}%</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
          <FilterX className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={handleApplyFilters} disabled={isLoading}>
          <Search className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
