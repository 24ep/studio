"use client";

import type { Dispatch, SetStateAction } from "react";
import { UserIcon as User } from "@heroicons/react/24/outline";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicantMobileFilterSection } from "./ApplicantMobileFilterSection";
import { ApplicantSkillsInput } from "./ApplicantSkillsInput";
import { ApplicantTextFilterField } from "./ApplicantTextFilterField";
import type { ApplicantTextOperator } from "./ApplicantTextOperatorSelect";

interface ApplicantMobileInfoFiltersProps {
  email: string;
  emailOperator: ApplicantTextOperator;
  location: string;
  name: string;
  nameOperator: ApplicantTextOperator;
  phone: string;
  phoneOperator: ApplicantTextOperator;
  skills: Set<string>;
  onEmailChange: (value: string) => void;
  onEmailOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onLocationChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onNameOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onPhoneChange: (value: string) => void;
  onPhoneOperatorChange: Dispatch<SetStateAction<ApplicantTextOperator>>;
  onSkillsChange: Dispatch<SetStateAction<Set<string>>>;
}

export function ApplicantMobileInfoFilters({
  email,
  emailOperator,
  location,
  name,
  nameOperator,
  phone,
  phoneOperator,
  skills,
  onEmailChange,
  onEmailOperatorChange,
  onLocationChange,
  onNameChange,
  onNameOperatorChange,
  onPhoneChange,
  onPhoneOperatorChange,
  onSkillsChange,
}: ApplicantMobileInfoFiltersProps) {
  return (
    <ApplicantMobileFilterSection
      value="Applicant-info"
      title="Applicant Information"
      icon={User}
      contentClassName="pt-4 space-y-4"
    >
      <ApplicantTextFilterField
        label="Name"
        value={name}
        onValueChange={onNameChange}
        operator={nameOperator}
        onOperatorChange={onNameOperatorChange}
        placeholder="Filter by name..."
      />
      <ApplicantTextFilterField
        label="Email"
        value={email}
        onValueChange={onEmailChange}
        operator={emailOperator}
        onOperatorChange={onEmailOperatorChange}
        placeholder="Filter by email..."
      />
      <ApplicantTextFilterField
        label="Phone"
        value={phone}
        onValueChange={onPhoneChange}
        operator={phoneOperator}
        onOperatorChange={onPhoneOperatorChange}
        placeholder="Filter by phone..."
      />
      <div className="space-y-2">
        <Label className="text-xs font-medium">Location</Label>
        <Input
          placeholder="e.g., Bangkok, Thailand..."
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Skills Keywords</Label>
        <ApplicantSkillsInput skills={skills} onSkillsChange={onSkillsChange} />
      </div>
    </ApplicantMobileFilterSection>
  );
}
