"use client";

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function ApplicationLogsDateFilter({
  id,
  label,
  date,
  fromYear,
  toYear,
  onDateChange,
}: {
  id: string;
  label: string;
  date?: Date;
  fromYear: number;
  toYear: number;
  onDateChange: (date?: Date) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
            />
          </PopoverContent>
        </Popover>
        {date && (
          <Button variant="outline" size="sm" onClick={() => onDateChange(undefined)} className="px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
