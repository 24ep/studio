
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
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "true", label: "Open" },
  { value: "false", label: "Closed" },
];

export function PositionFilters({ initialFilters = { isOpen: "all" }, onFilterChange, isLoading }: PositionFiltersProps) {
  const [title, setTitle] = useState(initialFilters.title || '');
  const [department, setDepartment] = useState(initialFilters.department || '');
  const [isOpen, setIsOpen] = useState<PositionFilterValues['isOpen']>(initialFilters.isOpen || "all");
  const [positionLevel, setPositionLevel] = useState(initialFilters.positionLevel || '');
  
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);

  useEffect(() => {
    setTitle(initialFilters.title || '');
    setDepartment(initialFilters.department || '');
    setIsOpen(initialFilters.isOpen || "all");
    setPositionLevel(initialFilters.positionLevel || '');
  }, [initialFilters]);


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
