"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, ListFilter, Check, ChevronsUpDown } from 'lucide-react';
import type { Position } from '@/lib/types';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CandidateFilterValues {
  name?: string;
  positionId?: string;
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
  const [positionSearchOpen, setPositionSearchOpen] = useState(false);
  const [currentPositionSearchDisplayValue, setCurrentPositionSearchDisplayValue] = useState(
    availablePositions.find(p => p.id === (initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE))?.title || "All Positions"
  );

  useEffect(() => {
    setName(initialFilters.name || '');
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
    const initialPosId = initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE;
    setPositionId(initialPosId);
    setCurrentPositionSearchDisplayValue(
      initialPosId === ALL_POSITIONS_SELECT_VALUE
        ? "All Positions"
        : availablePositions.find(p => p.id === initialPosId)?.title || "All Positions"
    );
  }, [initialFilters, availablePositions]);

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
    setCurrentPositionSearchDisplayValue("All Positions");
    setEducation('');
    setFitScoreRange([0, 100]);
    onFilterChange({
      positionId: undefined,
      minFitScore: 0,
      maxFitScore: 100,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
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
          <Label htmlFor="position-combobox">Position</Label>
          <Popover open={positionSearchOpen} onOpenChange={setPositionSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={positionSearchOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading}
              >
                <span className="truncate">
                  {currentPositionSearchDisplayValue}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
              <Command>
                <CommandInput placeholder="Search position..." />
                <CommandList>
                  <CommandEmpty>No position found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      key={ALL_POSITIONS_SELECT_VALUE}
                      value="All Positions"
                      onSelect={() => {
                        setPositionId(ALL_POSITIONS_SELECT_VALUE);
                        setCurrentPositionSearchDisplayValue("All Positions");
                        setPositionSearchOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          positionId === ALL_POSITIONS_SELECT_VALUE ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Positions
                    </CommandItem>
                    {availablePositions.map((pos) => (
                      <CommandItem
                        key={pos.id}
                        value={pos.title}
                        onSelect={(currentValue) => {
                          const selectedPos = availablePositions.find(p => p.title.toLowerCase() === currentValue.toLowerCase());
                          setPositionId(selectedPos ? selectedPos.id : ALL_POSITIONS_SELECT_VALUE);
                          setCurrentPositionSearchDisplayValue(selectedPos ? selectedPos.title : "All Positions");
                          setPositionSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            positionId === pos.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {pos.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
