import type { RecruitmentStage } from "@/lib/types";

export interface StatusMultiSelectDropdownProps {
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  stages: RecruitmentStage[];
  applicantCounts?: Record<string, number>;
}
