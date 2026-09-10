import * as React from "react";
import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PositionFilterTriggerProps extends Omit<ButtonProps, "children"> {
  activeFilterCount: number;
}

export const PositionFilterTrigger = React.forwardRef<
  HTMLButtonElement,
  PositionFilterTriggerProps
>(({ activeFilterCount, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    className={cn("relative h-10 gap-2", className)}
    {...props}
  >
    <Filter className="h-4 w-4" />
    Filter
    {activeFilterCount > 0 && (
      <Badge
        variant="secondary"
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
      >
        {activeFilterCount}
      </Badge>
    )}
  </Button>
));
PositionFilterTrigger.displayName = "PositionFilterTrigger";

interface PositionFilterPanelHeaderProps {
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function PositionFilterPanelHeader({
  activeFilterCount,
  onClearFilters,
}: PositionFilterPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="font-medium leading-none">Filters</h4>
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
