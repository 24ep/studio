
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FilterX, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  availableDepartments: string[]; // New prop
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
  
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);
  const [departmentSearchOpen, setDepartmentSearchOpen] = useState(false);
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');


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
    setDepartmentSearchQuery('');
    setIsOpen("all");
    setPositionLevel('');
    onFilterChange({ isOpen: "all" }); 
  };

  const filteredDepartments = departmentSearchQuery
    ? availableDepartments.filter(dept => dept.toLowerCase().includes(departmentSearchQuery.toLowerCase()))
    : availableDepartments;
  
  const getCurrentDepartmentDisplayValue = () => {
    if (department === ALL_DEPARTMENTS_SELECT_VALUE) return "All Departments";
    return department || "All Departments";
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
          <Label htmlFor="department-combobox">Department</Label>
          <Popover open={departmentSearchOpen} onOpenChange={setDepartmentSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={departmentSearchOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading}
              >
                <span className="truncate">
                  {getCurrentDepartmentDisplayValue()}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
              <div className="p-2">
                <Input
                  placeholder="Search department..."
                  value={departmentSearchQuery}
                  onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <ScrollArea className="max-h-60">
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", department === ALL_DEPARTMENTS_SELECT_VALUE && "bg-accent text-accent-foreground")}
                  onClick={() => {
                    setDepartment(ALL_DEPARTMENTS_SELECT_VALUE);
                    setDepartmentSearchOpen(false);
                    setDepartmentSearchQuery('');
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", department === ALL_DEPARTMENTS_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>
                  All Departments
                </Button>
                {filteredDepartments.length === 0 && departmentSearchQuery && (
                  <p className="p-2 text-sm text-muted-foreground text-center">No department found.</p>
                )}
                {filteredDepartments.map((dept) => (
                  <Button
                    key={dept}
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", department === dept && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setDepartment(dept);
                      setDepartmentSearchOpen(false);
                      setDepartmentSearchQuery('');
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", department === dept ? "opacity-100" : "opacity-0")}/>
                    {dept}
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
                  {statusOptions.find(opt => opt.value === isOpen)?.label || "All Statuses"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
              <ScrollArea className="max-h-60">
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    className={cn("w-full justify-start px-2 py-1.5 text-sm font-normal h-auto", isOpen === opt.value && "bg-accent text-accent-foreground")}
                    onClick={() => {
                      setIsOpen(opt.value as PositionFilterValues['isOpen']);
                      setStatusSearchOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", isOpen === opt.value ? "opacity-100" : "opacity-0")}/>
                    {opt.label}
                  </Button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
