
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FilterX } from 'lucide-react';

export interface PositionFilterValues {
  title?: string;
  department?: string;
  isOpen?: "all" | "true" | "false"; // "all" will mean no filter on status
  positionLevel?: string;
}

interface PositionFiltersProps {
  initialFilters?: PositionFilterValues;
  onFilterChange: (filters: PositionFilterValues) => void;
  isLoading?: boolean;
}

export function PositionFilters({ initialFilters = { isOpen: "all" }, onFilterChange, isLoading }: PositionFiltersProps) {
  const [title, setTitle] = useState(initialFilters.title || '');
  const [department, setDepartment] = useState(initialFilters.department || '');
  const [isOpen, setIsOpen] = useState<PositionFilterValues['isOpen']>(initialFilters.isOpen || "all");
  const [positionLevel, setPositionLevel] = useState(initialFilters.positionLevel || '');

  const handleApplyFilters = () => {
    onFilterChange({
      title: title || undefined,
      department: department || undefined,
      isOpen: isOpen === "all" ? undefined : isOpen,
      positionLevel: positionLevel || undefined,
    });
  };

  const handleResetFilters = () => {
    setTitle('');
    setDepartment('');
    setIsOpen("all");
    setPositionLevel('');
    onFilterChange({ isOpen: "all" }); // Reset to show all statuses by default
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="title-search">Position Title</Label>
          <Input
            id="title-search"
            placeholder="Search by title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="department-search">Department</Label>
          <Input
            id="department-search"
            placeholder="Search by department..."
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="status-select">Status</Label>
          <Select
            value={isOpen}
            onValueChange={(value) => setIsOpen(value as PositionFilterValues['isOpen'])}
            disabled={isLoading}
          >
            <SelectTrigger id="status-select" className="w-full mt-1">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="true">Open</SelectItem>
              <SelectItem value="false">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="level-search">Position Level</Label>
          <Input
            id="level-search"
            placeholder="Filter by level..."
            value={positionLevel}
            onChange={(e) => setPositionLevel(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
          <FilterX className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
        <Button onClick={handleApplyFilters} disabled={isLoading}>
          <Search className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}
