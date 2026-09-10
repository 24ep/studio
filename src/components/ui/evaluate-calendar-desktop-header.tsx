"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";

interface DesktopCalendarHeaderProps {
  currentMonth: Date;
  onToday: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function DesktopCalendarHeader({
  currentMonth,
  onToday,
  onPreviousMonth,
  onNextMonth,
}: DesktopCalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={onPreviousMonth}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Next month" onClick={onNextMonth}>
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
