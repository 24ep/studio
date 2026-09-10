import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PositionDepartmentFilterProps {
  departmentFilter: string;
  departmentPopoverOpen: boolean;
  departmentSearch: string;
  filteredDepartments: string[];
  allDepartments: string[];
  isLoadingDepartments: boolean;
  onDepartmentPopoverOpenChange: (open: boolean) => void;
  onDepartmentSearchChange: (value: string) => void;
  onDepartmentSelect: (department: string) => void;
}

export function PositionDepartmentFilter({
  departmentFilter,
  departmentPopoverOpen,
  departmentSearch,
  filteredDepartments,
  allDepartments,
  isLoadingDepartments,
  onDepartmentPopoverOpenChange,
  onDepartmentSearchChange,
  onDepartmentSelect,
}: PositionDepartmentFilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Department</label>
      <PositionDepartmentFilterContent
        departmentFilter={departmentFilter}
        departmentPopoverOpen={departmentPopoverOpen}
        departmentSearch={departmentSearch}
        filteredDepartments={filteredDepartments}
        allDepartments={allDepartments}
        isLoadingDepartments={isLoadingDepartments}
        onDepartmentPopoverOpenChange={onDepartmentPopoverOpenChange}
        onDepartmentSearchChange={onDepartmentSearchChange}
        onDepartmentSelect={onDepartmentSelect}
      />
    </div>
  );
}

function PositionDepartmentFilterContent({
  departmentFilter,
  departmentPopoverOpen,
  departmentSearch,
  filteredDepartments,
  allDepartments,
  isLoadingDepartments,
  onDepartmentPopoverOpenChange,
  onDepartmentSearchChange,
  onDepartmentSelect,
}: PositionDepartmentFilterProps) {
  if (isLoadingDepartments) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </div>
    );
  }

  if (allDepartments.length === 0) {
    return (
      <div className="flex h-9 items-center rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <span>No departments</span>
      </div>
    );
  }

  return (
    <Popover open={departmentPopoverOpen} onOpenChange={onDepartmentPopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={departmentPopoverOpen}
          className="h-9 w-full justify-between font-normal"
        >
          {departmentFilter === "all" ? "All Departments" : departmentFilter}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search departments..."
              value={departmentSearch}
              onChange={(event) => onDepartmentSearchChange(event.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <div className="max-h-[200px] overflow-y-auto p-1">
              <DepartmentOption
                label="All Departments"
                selected={departmentFilter === "all"}
                onSelect={() => onDepartmentSelect("all")}
              />

              {filteredDepartments.map((department) => (
                <DepartmentOption
                  key={department}
                  label={department}
                  selected={departmentFilter === department}
                  onSelect={() => onDepartmentSelect(department)}
                />
              ))}

              {filteredDepartments.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No departments found.
                </div>
              )}
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface DepartmentOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function DepartmentOption({ label, selected, onSelect }: DepartmentOptionProps) {
  return (
    <button
      type="button"
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
      onClick={onSelect}
    >
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
      {label}
    </button>
  );
}
