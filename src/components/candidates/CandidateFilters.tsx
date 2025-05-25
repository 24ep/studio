
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, ListFilter } from 'lucide-react';
import type { Position } from '@/lib/types';
import { mockPositions } from '@/lib/data'; // Using mock for available positions

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
}

export function CandidateFilters({ initialFilters = {}, onFilterChange }: CandidateFiltersProps) {
  const [name, setName] = useState(initialFilters.name || '');
  const [positionId, setPositionId] = useState(initialFilters.positionId || '');
  const [education, setEducation] = useState(initialFilters.education || '');
  const [fitScoreRange, setFitScoreRange] = useState<[number, number]>([
    initialFilters.minFitScore || 0,
    initialFilters.maxFitScore || 100,
  ]);

  const positions: Position[] = mockPositions; // In a real app, fetch this or pass as prop

  const handleApplyFilters = () => {
    onFilterChange({
      name: name || undefined,
      positionId: positionId || undefined,
      education: education || undefined,
      minFitScore: fitScoreRange[0],
      maxFitScore: fitScoreRange[1],
    });
  };

  const handleResetFilters = () => {
    setName('');
    setPositionId('');
    setEducation('');
    setFitScoreRange([0, 100]);
    onFilterChange({
      minFitScore: 0,
      maxFitScore: 100,
    });
  };

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
          />
        </div>
        <div>
          <Label htmlFor="position-select">Position</Label>
          <Select value={positionId} onValueChange={setPositionId}>
            <SelectTrigger id="position-select" className="w-full mt-1">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Positions</SelectItem>
              {positions.map((pos) => (
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
          />
        </div>
        <div>
          <Label>Fit Score ({fitScoreRange[0]} - {fitScoreRange[1]})</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal">
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
        <Button variant="outline" onClick={handleResetFilters}>
          <FilterX className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={handleApplyFilters}>
          <Search className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
