import type { useMyTasksFilterModal } from "./use-my-tasks-filter-modal";
import type { MyTasksFilters } from "./my-tasks-page-utils";
import type {
  MyTasksFilterRecruiter,
  MyTasksFilterStage,
} from "./my-tasks-filter-modal-utils";

export type MyTasksFilterActions = ReturnType<typeof useMyTasksFilterModal>["actions"];

export interface MyTasksFilterTabsProps {
  activeTab: string;
  filters: MyTasksFilters;
  recruiters: MyTasksFilterRecruiter[];
  selectedRecruiters: Set<string>;
  stages: Array<MyTasksFilterStage | string>;
  actions: MyTasksFilterActions;
}

export type MyTasksBasicFiltersProps = Omit<MyTasksFilterTabsProps, "activeTab">;

export type MyTasksAdvancedFiltersProps = Pick<
  MyTasksFilterTabsProps,
  "actions" | "filters"
>;
