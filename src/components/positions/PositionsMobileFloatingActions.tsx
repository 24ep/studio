"use client";

import { Filter, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PositionsMobileFloatingActionsProps {
  activeFilterCount: number;
  onOpenFilters: () => void;
  onAddPosition: () => void;
}

const floatingButtonShadow = {
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

export function PositionsMobileFloatingActions({
  activeFilterCount,
  onOpenFilters,
  onAddPosition,
}: PositionsMobileFloatingActionsProps) {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 md:hidden flex flex-row gap-3 items-center">
      <Button
        size="lg"
        className="h-12 px-6 rounded-full shadow-xl bg-background hover:bg-muted text-foreground border border-border transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
        style={floatingButtonShadow}
        onClick={onOpenFilters}
        aria-label="Open filters"
      >
        <Filter className="h-4 w-4 mr-2" />
        <span className="flex items-center gap-1">
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </span>
      </Button>
      <Button
        size="lg"
        className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-200 hover:scale-105 active:scale-95 p-0 flex items-center justify-center"
        style={floatingButtonShadow}
        onClick={onAddPosition}
        aria-label="Add Position"
      >
        <PlusCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
