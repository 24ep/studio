
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, ListFilter, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import type { Position, CandidateStatus, RecruitmentStage } from '@/lib/types';
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area'; // Assuming ScrollArea is available

export interface CandidateFilterValues {
  name?: string;
  positionId?: string;
  status?: CandidateStatus | 'all';
  education?: string;
  minFitScore?: number;
  maxFitScore?: number;
}

interface CandidateFiltersProps {
  initialFilters?: CandidateFilterValues;
  onFilterChange: (filters: CandidateFilterValues) => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  isLoading?: boolean;
}

const ALL_POSITIONS_SELECT_VALUE = "__ALL_POSITIONS__";
const ALL_STATUSES_SELECT_VALUE = "all";

export function CandidateFilters({ initialFilters = {}, onFilterChange, availablePositions, availableStages, isLoading }: CandidateFiltersProps) {
  const [name, setName] = useState(initialFilters.name || '');
  const [positionId, setPositionId] = useState(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
  const [status, setStatus] = useState<CandidateStatus | 'all'>(initialFilters.status || ALL_STATUSES_SELECT_VALUE);
  const [education, setEducation] = useState(initialFilters.education || '');
  const [fitScoreRange, setFitScoreRange] = useState<[number, number]>([
    initialFilters.minFitScore || 0,
    initialFilters.maxFitScore || 100,
  ]);

  const [positionSearchOpen, setPositionSearchOpen] = useState(false);
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');

  const getCurrentPositionDisplayValue = () => {
    if (positionId === ALL_POSITIONS_SELECT_VALUE) return "All Positions";
    return availablePositions.find(p => p.id === positionId)?.title || "All Positions";
  };

  const getCurrentStatusDisplayValue = () => {
    if (status === ALL_STATUSES_SELECT_VALUE) return "All Statuses";
    return availableStages.find(s => s.name === status)?.name || "All Statuses";
  };
  
  // Reset local state when initialFilters change (e.g., after a full page data refresh)
  useEffect(() => {
    setName(initialFilters.name || '');
    setPositionId(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
    setStatus(initialFilters.status || ALL_STATUSES_SELECT_VALUE);
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
  }, [initialFilters]);


  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      positionId: positionId === ALL_POSITIONS_SELECT_VALUE ? undefined : positionId,
      status: status === ALL_STATUSES_SELECT_VALUE ? undefined : status,
      education: education || undefined,
      minFitScore: fitScoreRange[0],
      maxFitScore: fitScoreRange[1],
    });
  };

  const handleResetFilters = () => {
    setName('');
    setPositionId(ALL_POSITIONS_SELECT_VALUE);
    setStatus(ALL_STATUSES_SELECT_VALUE);
    setEducation('');
    setFitScoreRange([0, 100]);
    setPositionSearchQuery('');
    setStatusSearchQuery('');
    onFilterChange({
      minFitScore: 0,
      maxFitScore: 100,
    });
  };

  const filteredPositions = positionSearchQuery
    ? availablePositions.filter(pos => pos.title.toLowerCase().includes(positionSearchQuery.toLowerCase()))
    : availablePositions;

  const filteredStages = statusSearchQuery
    ? availableStages.filter(stage => stage.name.toLowerCase().includes(statusSearchQuery.toLowerCase()))
    : availableStages;

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
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
                  {getCurrentPositionDisplayValue()}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
              <div className="p-2">
                <Input
                  placeholder="Search position..."
                  value={positionSearchQuery}
                  onChange={(e) => setPositionSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <ScrollArea className="max-h-60">
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", positionId === ALL_POSITIONS_SELECT_VALUE && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setPositionId(ALL_POSITIONS_SELECT_VALUE);
                      setPositionSearchOpen(false);
                      setPositionSearchQuery('');
                    }}
                >
                    <Check className={cn("mr-2 h-4 w-4", positionId === ALL_POSITIONS_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>
                    All Positions
                </Button>
                {filteredPositions.length === 0 && positionSearchQuery && (
                  <p className="p-2 text-sm text-muted-foreground text-center">No position found.</p>
                )}
                {filteredPositions.map((pos) => (
                  <Button
                    key={pos.id}
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", positionId === pos.id && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setPositionId(pos.id);
                      setPositionSearchOpen(false);
                      setPositionSearchQuery('');
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", positionId === pos.id ? "opacity-100" : "opacity-0")}/>
                    {pos.title}
                  </Button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="status-combobox">Status</Label>
          <Popover open={statusSearchOpen} onOpenChange={setStatusSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statusSearchOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading}
              >
                <span className="truncate">
                  {getCurrentStatusDisplayValue()}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
              <div className="p-2">
                <Input
                  placeholder="Search status..."
                  value={statusSearchQuery}
                  onChange={(e) => setStatusSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <ScrollArea className="max-h-60">
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", status === ALL_STATUSES_SELECT_VALUE && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setStatus(ALL_STATUSES_SELECT_VALUE);
                      setStatusSearchOpen(false);
                      setStatusSearchQuery('');
                    }}
                >
                    <Check className={cn("mr-2 h-4 w-4", status === ALL_STATUSES_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>
                    All Statuses
                </Button>
                {filteredStages.length === 0 && statusSearchQuery && (
                  <p className="p-2 text-sm text-muted-foreground text-center">No status found.</p>
                )}
                {filteredStages.map((st) => (
                  <Button
                    key={st.id}
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", status === st.name && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setStatus(st.name);
                      setStatusSearchOpen(false);
                      setStatusSearchQuery('');
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", status === st.name ? "opacity-100" : "opacity-0")}/>
                    {st.name}
                  </Button>
                ))}
              </ScrollArea>
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
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
