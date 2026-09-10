"use client";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, safeGetDateFromRange } from "@/lib/utils";
import {
  PERIOD_TYPES,
  PERIOD_UNITS,
  type NewApplicationsPeriodType,
  type NewApplicationsPeriodUnit,
} from "./new-applications-time-series-utils";

export function isNewApplicationsPeriodType(value: string): value is NewApplicationsPeriodType {
  return PERIOD_TYPES.some(option => option.value === value);
}

export function isNewApplicationsPeriodUnit(value: string): value is NewApplicationsPeriodUnit {
  return PERIOD_UNITS.some(option => option.value === value);
}

export function NewApplicationsPeriodTypeSelect({
  periodType,
  onPeriodTypeChange,
}: {
  periodType: NewApplicationsPeriodType;
  onPeriodTypeChange: (value: NewApplicationsPeriodType) => void;
}) {
  return (
    <Select
      value={periodType}
      onValueChange={(value) => {
        if (isNewApplicationsPeriodType(value)) {
          onPeriodTypeChange(value);
        }
      }}
    >
      <SelectTrigger className="w-28 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_TYPES.map(option => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NewApplicationsPeriodUnitSelect({
  className,
  periodUnit,
  onPeriodUnitChange,
}: {
  className: string;
  periodUnit: NewApplicationsPeriodUnit;
  onPeriodUnitChange: (value: NewApplicationsPeriodUnit) => void;
}) {
  return (
    <Select
      value={periodUnit}
      onValueChange={(value) => {
        if (isNewApplicationsPeriodUnit(value)) {
          onPeriodUnitChange(value);
        }
      }}
    >
      <SelectTrigger className={`${className} h-8 text-xs`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_UNITS.map(option => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NewApplicationsPeriodAmountControls({
  periodN,
  periodUnit,
  max,
  unitWidth,
  onPeriodNChange,
  onPeriodUnitChange,
}: {
  periodN: number;
  periodUnit: NewApplicationsPeriodUnit;
  max: number;
  unitWidth: string;
  onPeriodNChange: (value: number) => void;
  onPeriodUnitChange: (value: NewApplicationsPeriodUnit) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={max}
        value={periodN}
        onChange={event => onPeriodNChange(Number(event.target.value))}
        className="w-16 h-8 text-xs border border-input bg-background text-foreground rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ minWidth: 40 }}
      />
      <NewApplicationsPeriodUnitSelect
        className={unitWidth}
        periodUnit={periodUnit}
        onPeriodUnitChange={onPeriodUnitChange}
      />
    </div>
  );
}

function NewApplicationsDateRangeLabel({ dateRange }: { dateRange: DateRange | undefined }) {
  const fromDate = safeGetDateFromRange(dateRange, "from");
  const toDate = safeGetDateFromRange(dateRange, "to");

  if (fromDate && toDate) {
    return (
      <>
        <span className="font-semibold text-blue-700">{format(fromDate, "MMM dd, yyyy")}</span>
        <span className="mx-1 text-blue-400">-</span>
        <span className="font-semibold text-blue-700">{format(toDate, "MMM dd, yyyy")}</span>
      </>
    );
  }

  if (fromDate) {
    return <span className="font-semibold text-blue-700">{format(fromDate, "MMM dd, yyyy")}</span>;
  }

  return <span className="text-blue-400">Pick a date range</span>;
}

export function NewApplicationsCustomDateRangeControl({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: DateRange | undefined;
  onDateRangeChange: (value: DateRange | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-accent hover:bg-accent/80 transition-colors text-xs font-medium shadow-sm",
            !dateRange && "text-muted-foreground",
          )}
          style={{ minWidth: 180 }}
        >
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="whitespace-nowrap">
            <NewApplicationsDateRangeLabel dateRange={dateRange} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" style={{ minWidth: 400 }}>
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
  );
}
