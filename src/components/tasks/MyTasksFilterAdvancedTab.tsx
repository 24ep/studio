import {
  Briefcase,
  Calendar,
  CircleSlash,
  TrendingUp,
  User,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import {
  DateFilterInput,
  FilterField,
  NumberFilterInput,
  SelectFilter,
} from "./MyTasksFilterFieldControls";
import type { MyTasksAdvancedFiltersProps } from "./MyTasksFilterModalPartsTypes";
import { useLocalization } from '@/contexts/LocalizationContext';

export function MyTasksAdvancedFilters({
  filters,
  actions,
}: MyTasksAdvancedFiltersProps) {
  const { t } = useLocalization();

  return (
    <TabsContent value="advanced" className="h-full space-y-6">
      <FilterField
        icon={<TrendingUp className="w-4 h-4" />}
        label={t("tasks.filters.fitScoreRange", "Fit Score Range")}
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberFilterInput
            label={t("tasks.filters.minimum", "Minimum")}
            value={filters.minFitScore}
            placeholder="0"
            onChange={(value) => actions.setFilter("minFitScore", value)}
          />
          <NumberFilterInput
            label={t("tasks.filters.maximum", "Maximum")}
            value={filters.maxFitScore}
            placeholder="100"
            onChange={(value) => actions.setFilter("maxFitScore", value)}
          />
        </div>
      </FilterField>

      <Separator />

      <FilterField
        icon={<Calendar className="w-4 h-4" />}
        label={t("tasks.filters.applicationDateRange", "Application Date Range")}
      >
        <div className="grid grid-cols-2 gap-3">
          <DateFilterInput
            label={t("common.from", "From")}
            value={filters.applicationDateStart}
            onChange={(value) => actions.setFilter("applicationDateStart", value)}
          />
          <DateFilterInput
            label={t("common.to", "To")}
            value={filters.applicationDateEnd}
            onChange={(value) => actions.setFilter("applicationDateEnd", value)}
          />
        </div>
      </FilterField>

      <Separator />

      <AdditionalFilters filters={filters} actions={actions} />
    </TabsContent>
  );
}

function AdditionalFilters({
  filters,
  actions,
}: MyTasksAdvancedFiltersProps) {
  const { t } = useLocalization();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t("tasks.filters.additional", "Additional Filters")}</Label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectFilter
          icon={<User className="h-3.5 w-3.5" />}
          label={t("tasks.filters.assignment", "Assignment")}
          value={filters.assignmentStatus || "all"}
          placeholder={t("tasks.filters.anyAssignment", "Any assignment")}
          selectId="my-tasks-assignment-filter"
          options={[
            ["all", t("tasks.filters.anyAssignment", "Any assignment")],
            ["assigned", t("tasks.filters.assigned", "Assigned")],
            ["unassigned", t("tasks.filters.unassigned", "Unassigned")],
          ]}
          onChange={(value) => actions.setFilter("assignmentStatus", value === "all" ? undefined : value)}
        />
        <SelectFilter
          icon={<Briefcase className="h-3.5 w-3.5" />}
          label={t("tasks.filters.position", "Position")}
          value={filters.positionStatus || "all"}
          placeholder={t("tasks.filters.anyPosition", "Any position")}
          selectId="my-tasks-position-status-filter"
          options={[
            ["all", t("tasks.filters.anyPosition", "Any position")],
            ["with-position", t("tasks.filters.withPosition", "Has position")],
            ["without-position", t("tasks.filters.withoutPosition", "No position")],
          ]}
          onChange={(value) => actions.setFilter("positionStatus", value === "all" ? undefined : value)}
        />
        <SelectFilter
          icon={<CircleSlash className="h-3.5 w-3.5" />}
          label={t("tasks.filters.score", "Score")}
          value={filters.scoreStatus || "all"}
          placeholder={t("tasks.filters.anyScore", "Any score")}
          selectId="my-tasks-score-status-filter"
          options={[
            ["all", t("tasks.filters.anyScore", "Any score")],
            ["scored", t("tasks.filters.scored", "Has fit score")],
            ["unscored", t("tasks.filters.unscored", "No fit score")],
          ]}
          onChange={(value) => actions.setFilter("scoreStatus", value === "all" ? undefined : value)}
        />
      </div>
    </div>
  );
}
