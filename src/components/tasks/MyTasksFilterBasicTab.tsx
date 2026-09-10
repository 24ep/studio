import {
  Calendar,
  ChevronDown,
  Filter,
  Search,
  Target,
  User,
} from "lucide-react";
import { useLocalization } from '@/contexts/LocalizationContext';
import { PositionSelectDropdown } from "@/components/applicants/PositionSelectDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RecruiterAvatarCompact } from "@/components/ui/recruiter-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { FilterField } from "./MyTasksFilterFieldControls";
import type {
  MyTasksBasicFiltersProps,
  MyTasksFilterActions,
} from "./MyTasksFilterModalPartsTypes";
import {
  getStageOptionLabel,
  getStageOptionValue,
  type MyTasksFilterRecruiter,
} from "./my-tasks-filter-modal-utils";

export function MyTasksBasicFilters({
  filters,
  recruiters,
  selectedRecruiters,
  stages,
  actions,
}: MyTasksBasicFiltersProps) {
  const { t } = useLocalization();
  const selectedStageValue = Array.isArray(filters.stage)
    ? filters.stage[0] || "all"
    : filters.stage || "all";

  return (
    <TabsContent value="basic" className="h-full space-y-6">
      <FilterField
        icon={<Search className="w-4 h-4" />}
        label={t("tasks.filters.search", "Search")}
      >
        <Input
          value={filters.name || ""}
          onChange={(event) => actions.setFilter("name", event.target.value)}
          placeholder={t("tasks.filters.searchApplicantsPlaceholder", "Search by Applicant name...")}
          className="h-10"
        />
      </FilterField>

      <Separator />

      <FilterField
        icon={<Target className="w-4 h-4" />}
        label={t("tasks.filters.position", "Position")}
      >
        <PositionSelectDropdown
          value={filters.positionId || ""}
          onValueChange={(value) => actions.setFilter("positionId", value || undefined)}
          placeholder={t("tasks.filters.allPositions", "All positions")}
          showOpenStatus={true}
          filterOpenOnly={false}
          showNoneOption={true}
        />
      </FilterField>

      <Separator />

      <FilterField
        icon={<Calendar className="w-4 h-4" />}
        label={t("tasks.filters.stage", "Stage")}
      >
        <Select
          value={selectedStageValue}
          onValueChange={(value) => actions.setFilter("stage", value === "all" ? undefined : value)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("tasks.filters.allStages", "All stages")} />
          </SelectTrigger>
          <SelectContent selectId="my-tasks-filter-stage-select">
            <SelectItem value="all">{t("tasks.filters.allStagesLabel", "All Stages")}</SelectItem>
            {stages.map((stage) => {
              const value = getStageOptionValue(stage);
              return (
                <SelectItem key={value} value={value}>
                  {getStageOptionLabel(stage)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </FilterField>

      <Separator />

      <RecruiterFilter
        recruiters={recruiters}
        selectedRecruiters={selectedRecruiters}
        actions={actions}
      />
    </TabsContent>
  );
}

function RecruiterFilter({
  actions,
  recruiters,
  selectedRecruiters,
}: {
  actions: MyTasksFilterActions;
  recruiters: MyTasksFilterRecruiter[];
  selectedRecruiters: Set<string>;
}) {
  const { t } = useLocalization();
  return (
    <FilterField icon={<User className="w-4 h-4" />} label={t("tasks.filters.recruiters", "Recruiters")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedRecruiters.size === 0
                ? t("tasks.filters.allRecruiters", `All Recruiters (${recruiters.length})`)
                : selectedRecruiters.size === 1
                  ? t("tasks.filters.recruiterSelectedOne", `1 Recruiter`)
                  : t("tasks.filters.recruitersSelected", `${selectedRecruiters.size} Recruiters`)
              }
            </div>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
          popoverId="my-tasks-recruiter-dropdown"
          zIndexType="dropdown"
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{t("tasks.filters.filterRecruiters", "Filter Recruiters")}</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.handleSelectAllRecruiters}
                  className="h-6 px-2 text-xs"
                >
                  {t("common.all", "All")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.handleClearAllRecruiters}
                  className="h-6 px-2 text-xs"
                >
                  {t("common.clear", "Clear")}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {recruiters.map((recruiter) => (
              <button
                type="button"
                key={recruiter.id}
                onClick={() => actions.handleToggleRecruiter(recruiter.id)}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
              >
                <RecruiterAvatarCompact
                  user={{
                    id: recruiter.id,
                    name: recruiter.name || t("tasks.recruiters.unknownRecruiter", "Unknown Recruiter"),
                    avatarUrl: recruiter.avatarUrl,
                    personalColor: recruiter.personalColor,
                  }}
                  size="xs"
                />
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{recruiter.name}</span>
                  <span className="text-xs text-muted-foreground">{t("common.recruiter", "Recruiter")}</span>
                </div>
                {selectedRecruiters.has(recruiter.id) && (
                  <div className="w-4 h-4 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </FilterField>
  );
}
