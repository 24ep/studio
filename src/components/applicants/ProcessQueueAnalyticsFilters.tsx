"use client";

import { CalendarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, safeGetDateFromRange } from "@/lib/utils";
import {
  getDefaultProcessQueueDateRange,
  type ProcessQueueDatePreset,
} from "./process-queue-analytics-date-utils";

interface ProcessQueueAnalyticsFiltersProps {
  dateRange: DateRange | undefined;
  statusFilter: string;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onStatusFilterChange: (status: string) => void;
  onDatePresetChange: (preset: ProcessQueueDatePreset) => void;
}

function getDateRangeLabel(dateRange: DateRange | undefined) {
  const fromDate = safeGetDateFromRange(dateRange, "from");
  const toDate = safeGetDateFromRange(dateRange, "to");

  if (fromDate && toDate) {
    return `${format(fromDate, "MMM dd, yyyy")} - ${format(toDate, "MMM dd, yyyy")}`;
  }

  if (fromDate) {
    return format(fromDate, "MMM dd, yyyy");
  }

  return "Last 30 days";
}

const datePresetButtons: Array<{ label: string; value: ProcessQueueDatePreset }> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
];

export function ProcessQueueAnalyticsFilters({
  dateRange,
  statusFilter,
  onDateRangeChange,
  onStatusFilterChange,
  onDatePresetChange,
}: ProcessQueueAnalyticsFiltersProps) {
  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-border/70 bg-background p-4 shadow-[0_1px_2px_hsl(var(--foreground)/.03)] md:grid-cols-[2fr_1fr] md:items-end">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Label htmlFor="dateRange" className="text-xs text-muted-foreground">Date Range</Label>
          <div className="flex space-x-2 mt-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 flex-1 justify-start rounded-lg text-left text-sm font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {getDateRangeLabel(dateRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateRangeChange(getDefaultProcessQueueDateRange())}
              className="h-9 rounded-lg px-3"
              title="Reset to last 30 days"
            >
              30d
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {datePresetButtons.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                size="sm"
                onClick={() => onDatePresetChange(preset.value)}
                className="h-7 rounded-md px-2 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="status" className="text-xs text-muted-foreground">Status Filter</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-9 rounded-lg text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="inprocess">In Process</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
