
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FilterX, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PositionFilterValues {
  title?: string;
  department?: string;
  isOpen?: "all" | "true" | "false";
  positionLevel?: string;
}

interface PositionFiltersProps {
  initialFilters?: PositionFilterValues;
  onFilterChange: (filters: PositionFilterValues) => void;
  isLoading?: boolean;
  availableDepartments: string[]; 
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "true", label: "Open" },
  { value: "false", label: "Closed" },
];

const ALL_DEPARTMENTS_SELECT_VALUE = "__ALL_DEPARTMENTS__";

export function PositionFilters({ initialFilters = { isOpen: "all" }, onFilterChange, isLoading, availableDepartments }: PositionFiltersProps) {
  const [title, setTitle] = useState(initialFilters.title || '');
  const [department, setDepartment] = useState(initialFilters.department || ALL_DEPARTMENTS_SELECT_VALUE);
  const [isOpen, setIsOpen] = useState<PositionFilterValues['isOpen']>(initialFilters.isOpen || "all");
  const [positionLevel, setPositionLevel] = useState(initialFilters.positionLevel || '');
  
  useEffect(() => {
    setTitle(initialFilters.title || '');
    setDepartment(initialFilters.department || ALL_DEPARTMENTS_SELECT_VALUE);
    setIsOpen(initialFilters.isOpen || "all");
    setPositionLevel(initialFilters.positionLevel || '');
  }, [initialFilters]);


  const handleApplyFilters = () => {
    onFilterChange({
      title: title || undefined,
      department: department === ALL_DEPARTMENTS_SELECT_VALUE ? undefined : department,
      isOpen: isOpen === "all" ? undefined : isOpen,
      positionLevel: positionLevel || undefined,
    });
  };

  const handleResetFilters = () => {
    setTitle('');
    setDepartment(ALL_DEPARTMENTS_SELECT_VALUE);
    setIsOpen("all");
    setPositionLevel('');
    onFilterChange({ isOpen: "all" }); 
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
          <Label htmlFor="department-select">Department</Label>
          <Select value={department} onValueChange={(value) => setDepartment(value)} disabled={isLoading}>
            <SelectTrigger id="department-select" className="w-full mt-1">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEPARTMENTS_SELECT_VALUE}>All Departments</SelectItem>
              {availableDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status-select">Status</Label>
          <Select value={isOpen} onValueChange={(value) => setIsOpen(value as PositionFilterValues['isOpen'])} disabled={isLoading}>
            <SelectTrigger id="status-select" className="w-full mt-1">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
