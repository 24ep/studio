
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FilterX, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PositionFilterValues {
  title?: string;
  selectedDepartments?: string[];
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

export function PositionFilters({ initialFilters = { isOpen: "all" }, onFilterChange, isLoading, availableDepartments }: PositionFiltersProps) {
  const [title, setTitle] = useState(initialFilters.title || '');
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set(initialFilters.selectedDepartments || []));
  const [isOpen, setIsOpen] = useState<PositionFilterValues['isOpen']>(initialFilters.isOpen || "all");
  const [positionLevel, setPositionLevel] = useState(initialFilters.positionLevel || '');
  
  useEffect(() => {
    setTitle(initialFilters.title || '');
    setSelectedDepartments(new Set(initialFilters.selectedDepartments || []));
    setIsOpen(initialFilters.isOpen || "all");
    setPositionLevel(initialFilters.positionLevel || '');
  }, [initialFilters]);


  const handleApplyFilters = () => {
    onFilterChange({
      title: title || undefined,
      selectedDepartments: selectedDepartments.size > 0 ? Array.from(selectedDepartments) : undefined,
      isOpen: isOpen === "all" ? undefined : isOpen,
      positionLevel: positionLevel || undefined,
    });
  };

  const handleResetFilters = () => {
    setTitle('');
    setSelectedDepartments(new Set());
    setIsOpen("all");
    setPositionLevel('');
    onFilterChange({ isOpen: "all", selectedDepartments: undefined }); 
  };
  
  const renderMultiSelectDepartmentTrigger = () => {
    if (selectedDepartments.size === 0) return "All Departments";
    if (selectedDepartments.size === 1) return Array.from(selectedDepartments)[0];
    return `${selectedDepartments.size} departments selected`;
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
          <Label htmlFor="department-select">Department(s)</Label>
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full mt-1 justify-between text-xs font-normal">
                    {renderMultiSelectDepartmentTrigger()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                <Command>
                    <CommandInput placeholder="Search departments..." className="h-9 text-xs" />
                    <CommandEmpty>No departments found.</CommandEmpty>
                    <CommandList>
                        <ScrollArea className="max-h-48">
                        {availableDepartments.map((dept) => (
                            <CommandItem
                                key={dept}
                                value={dept}
                                onSelect={() => {
                                    setSelectedDepartments(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(dept)) newSet.delete(dept);
                                        else newSet.add(dept);
                                        return newSet;
                                    });
                                }}
                                className="text-xs"
                            >
                                <Check className={cn("mr-2 h-4 w-4", selectedDepartments.has(dept) ? "opacity-100" : "opacity-0")}/>
                                {dept}
                            </CommandItem>
                        ))}
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
          </Popover>
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
