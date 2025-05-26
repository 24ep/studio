
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, FilterX } from 'lucide-react';

export interface PositionFilterValues {
  title?: string;
  department?: string;
}

interface PositionFiltersProps {
  initialFilters?: PositionFilterValues;
  onFilterChange: (filters: PositionFilterValues) => void;
  isLoading?: boolean;
}

export function PositionFilters({ initialFilters = {}, onFilterChange, isLoading }: PositionFiltersProps) {
  const [title, setTitle] = useState(initialFilters.title || '');
  const [department, setDepartment] = useState(initialFilters.department || '');

  const handleApplyFilters = () => {
    onFilterChange({
      title: title || undefined,
      department: department || undefined,
    });
  };

  const handleResetFilters = () => {
    setTitle('');
    setDepartment('');
    onFilterChange({});
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
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
        {/* Placeholder for more filters if needed */}
        <div /> 
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
