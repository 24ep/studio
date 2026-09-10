"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  APPLICANT_SCORE_PERIOD_COUNTS,
  APPLICANT_SCORE_PERIOD_TYPES,
  APPLICANT_SCORE_PERIOD_UNITS,
  type ApplicantScorePeriodType,
  type ApplicantScorePeriodUnit,
} from "./applicant-score-distribution-utils";

interface ApplicantScorePeriodControlsProps {
  dateRange?: DateRange;
  periodN: number;
  periodType: ApplicantScorePeriodType;
  periodUnit: ApplicantScorePeriodUnit;
  onDateRangeChange: (range?: DateRange) => void;
  onPeriodNChange: (periodN: number) => void;
  onPeriodTypeChange: (periodType: ApplicantScorePeriodType) => void;
  onPeriodUnitChange: (periodUnit: ApplicantScorePeriodUnit) => void;
}

export function ApplicantScorePeriodControls({
  dateRange,
  periodN,
  periodType,
  periodUnit,
  onDateRangeChange,
  onPeriodNChange,
  onPeriodTypeChange,
  onPeriodUnitChange,
}: ApplicantScorePeriodControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={periodType} onValueChange={(value) => onPeriodTypeChange(value as ApplicantScorePeriodType)}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPLICANT_SCORE_PERIOD_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-xs">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(periodType === "lastN" || periodType === "pastN") && (
        <>
          <Select value={periodN.toString()} onValueChange={(value) => onPeriodNChange(parseInt(value))}>
            <SelectTrigger className="w-[60px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICANT_SCORE_PERIOD_COUNTS.map((count) => (
                <SelectItem key={count} value={count.toString()} className="text-xs">
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ApplicantScorePeriodUnitSelect
            value={periodUnit}
            onValueChange={onPeriodUnitChange}
          />
        </>
      )}

      {periodType === "this" && (
        <ApplicantScorePeriodUnitSelect
          value={periodUnit}
          onValueChange={onPeriodUnitChange}
        />
      )}

      {periodType === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] h-8 text-xs justify-start text-left font-normal",
                !dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd")
                )
              ) : (
                <span>Pick a date range</span>
              )}
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
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function ApplicantScorePeriodUnitSelect({
  value,
  onValueChange,
}: {
  value: ApplicantScorePeriodUnit;
  onValueChange: (value: ApplicantScorePeriodUnit) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as ApplicantScorePeriodUnit)}>
      <SelectTrigger className="w-[80px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APPLICANT_SCORE_PERIOD_UNITS.map((unit) => (
          <SelectItem key={unit.value} value={unit.value} className="text-xs">
            {unit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
