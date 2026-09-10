import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { MyTasksFilters } from "./my-tasks-page-utils";
import {
  buildTaskFilterBadges,
  type MyTasksFilterPosition,
  type MyTasksFilterRecruiter,
} from "./my-tasks-filter-modal-utils";
import { useLocalization } from '@/contexts/LocalizationContext';

interface ActiveFiltersDisplayProps {
  activeFilterCount: number;
  filters: MyTasksFilters;
  hasActiveFilters: boolean;
  positions: MyTasksFilterPosition[];
  recruiters: MyTasksFilterRecruiter[];
  onRemoveFilter: (key: string) => void;
}

export function ActiveFiltersDisplay({
  activeFilterCount,
  filters,
  hasActiveFilters,
  positions,
  recruiters,
  onRemoveFilter,
}: ActiveFiltersDisplayProps) {
  const { t } = useLocalization();

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium">{t("tasks.filters.activeFilters", "Active Filters")}</Label>
        <Badge variant="secondary" className="text-xs">
          {t("tasks.filters.activeFilterCount", "{count} active").replace("{count}", `${activeFilterCount}`)}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {buildTaskFilterBadges(filters, positions, recruiters).map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20"
          >
            {filter.label}: {filter.displayValue}
            <button
              type="button"
              className="ml-1 text-primary/60 hover:text-primary transition-colors"
              onClick={() => onRemoveFilter(filter.key)}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
