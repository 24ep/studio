import type { UseFormReturn } from "react-hook-form";

import type { Grade, PositionLevel } from "@/lib/types";
import type { AddPositionFormValues } from "./add-position-form";
import type { OrganizationUnitOption } from './PositionOrganizationPathFields';

export interface AddPositionMobileDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPosition: (data: AddPositionFormValues) => Promise<void>;
}

export type AddPositionMobileStep = "basic" | "description" | "criteria";

export interface RecruiterOption {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface AddPositionMobileDrawerState {
  availableRecruiter: RecruiterOption[];
  canGenerateDescription: boolean;
  canProceedToNextStep: boolean;
  currentStep: AddPositionMobileStep;
  defaultMatchCriteria: string;
  form: UseFormReturn<AddPositionFormValues>;
  grades: Grade[];
  isGeneratingDescription: boolean;
  isLoadingDefaultCriteria: boolean;
  isLoadingLevels: boolean;
  isModalReady: boolean;
  isSaving: boolean;
  positionLevels: PositionLevel[];
  organizationUnits: OrganizationUnitOption[];
  showReplaceConfirmation: boolean;
  stepNumber: number;
  stepTitle: string;
}

export interface AddPositionMobileDrawerActions {
  back: () => void;
  confirmReplaceDescription: () => Promise<void>;
  generateJobDescription: () => Promise<void>;
  next: () => void;
  setShowReplaceConfirmation: (open: boolean) => void;
  submit: () => void;
}

export const ADD_POSITION_MOBILE_STEP_TITLES: Record<
  AddPositionMobileStep,
  string
> = {
  basic: "Basic Information",
  description: "Job Description",
  criteria: "Match Criteria",
};
