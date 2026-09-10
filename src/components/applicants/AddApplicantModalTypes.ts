import type { ApplicantSource, RecruitmentStage } from "@/lib/types";

export interface AddApplicantModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplicantCreated: () => Promise<void>;
  availableStages: RecruitmentStage[];
  availableSources: ApplicantSource[];
}
