"use client";

import type { Dispatch, SetStateAction } from "react";
import { ClockIcon as Clock } from "@heroicons/react/24/outline";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicantMobileFilterSection } from "./ApplicantMobileFilterSection";
import {
  updateExperienceMaximum,
  updateExperienceMinimum,
} from "./applicant-mobile-filters-panel-utils";

export function ApplicantMobileExperienceSection({
  experienceYearsRange,
  onExperienceYearsRangeChange,
}: {
  experienceYearsRange: [number, number];
  onExperienceYearsRangeChange: Dispatch<SetStateAction<[number, number]>>;
}) {
  return (
    <ApplicantMobileFilterSection
      value="experience"
      title="Experience"
      icon={Clock}
      contentClassName="pt-4 space-y-4"
    >
      <div className="space-y-2">
        <Label className="text-xs font-medium">Experience Years</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={experienceYearsRange[0] || ""}
            onChange={(event) => onExperienceYearsRangeChange(
              updateExperienceMinimum(experienceYearsRange, event.target.value)
            )}
            className="h-8"
          />
          <span className="text-sm">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={experienceYearsRange[1] || ""}
            onChange={(event) => onExperienceYearsRangeChange(
              updateExperienceMaximum(experienceYearsRange, event.target.value)
            )}
            className="h-8"
          />
        </div>
      </div>
    </ApplicantMobileFilterSection>
  );
}
