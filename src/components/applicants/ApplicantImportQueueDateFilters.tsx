"use client";

import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, XMarkIcon as X } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UploadQueueDateFilterType } from './applicant-import-queue-util-types';
import type { ApplicantImportQueueFiltersProps } from './ApplicantImportQueueFiltersTypes';

export function QueueDateTypeFilter({
  dateFilterType,
  handleDateFilterTypeChange,
  openSelect,
  setOpenSelect,
}: Pick<ApplicantImportQueueFiltersProps, 'dateFilterType' | 'handleDateFilterTypeChange' | 'openSelect' | 'setOpenSelect'>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="dateFilterType" className="text-xs text-muted-foreground">Date Type</Label>
      <Select
        value={dateFilterType}
        onValueChange={handleDateFilterTypeChange}
        open={openSelect === 'dateFilterType'}
        onOpenChange={(open) => setOpenSelect(open ? 'dateFilterType' : null)}
      >
        <SelectTrigger className="h-9 rounded-lg text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="create">Create Date</SelectItem>
          <SelectItem value="process">Process Date</SelectItem>
          <SelectItem value="complete">Complete Date</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function QueueDateRangeFilter({
  clearDateRange,
  dateFilterType,
  dateRange,
  handleDateRangeChange,
}: Pick<ApplicantImportQueueFiltersProps, 'clearDateRange' | 'dateFilterType' | 'dateRange' | 'handleDateRangeChange'>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="dateRange" className="text-xs text-muted-foreground">
        {getDateFilterLabel(dateFilterType)}
      </Label>
      <div className="flex space-x-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 flex-1 justify-start rounded-lg text-left text-sm font-normal",
                !dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {getDateRangeLabel(dateRange)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>
        {dateRange && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearDateRange}
            className="h-9 rounded-lg px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function QueueQuickDateButtons({
  setDatePreset,
}: Pick<ApplicantImportQueueFiltersProps, 'setDatePreset'>) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Quick Dates</Label>
      <div className="flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDatePreset('today')}
          className="h-9 rounded-lg px-2.5 text-xs"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDatePreset('last7days')}
          className="h-9 rounded-lg px-2.5 text-xs"
        >
          7d
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDatePreset('last30days')}
          className="h-9 rounded-lg px-2.5 text-xs"
        >
          30d
        </Button>
      </div>
    </div>
  );
}

function getDateFilterLabel(dateFilterType: UploadQueueDateFilterType) {
  if (dateFilterType === 'create') return 'Create Date';
  if (dateFilterType === 'process') return 'Process Date';
  return 'Complete Date';
}

function getDateRangeLabel(dateRange?: DateRange) {
  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;

  if (fromDate && toDate) {
    return (
      <>
        {format(fromDate, "MMM dd")} - {format(toDate, "MMM dd")}
      </>
    );
  }

  if (fromDate) {
    return format(fromDate, "MMM dd");
  }

  return <span>Date</span>;
}
