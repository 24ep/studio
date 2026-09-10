"use client";

import { UserIcon as User } from "@heroicons/react/24/outline";

import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { ApplicantFilterSectionHeader } from "./ApplicantFilterSectionHeader";
import { ApplicantSkillsInput } from "./ApplicantSkillsInput";
import { ApplicantTextFilterField } from "./ApplicantTextFilterField";
import type {
  ApplicantLocationOperator,
  ApplicantTextOperator,
} from "./ApplicantTextOperatorSelect";

interface ApplicantDesktopInfoFilterSectionProps {
  isLoading?: boolean;
  isAiSearching?: boolean;
  name: string;
  email: string;
  phone: string;
  location: string;
  nameOperator: ApplicantTextOperator;
  emailOperator: ApplicantTextOperator;
  phoneOperator: ApplicantTextOperator;
  locationOperator: ApplicantLocationOperator;
  skills: Set<string>;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNameOperatorChange: (operator: ApplicantTextOperator) => void;
  onEmailOperatorChange: (operator: ApplicantTextOperator) => void;
  onPhoneOperatorChange: (operator: ApplicantTextOperator) => void;
  onLocationOperatorChange: (operator: ApplicantLocationOperator) => void;
  onSkillsChange: (skills: Set<string>) => void;
  onNameFocus: () => void;
  onNameBlur: () => void;
  onLocationFocus: () => void;
  onLocationBlur: () => void;
  onApply: () => void;
  onScheduleSkillsApply: () => void;
  onReset: () => void;
}

export function ApplicantDesktopInfoFilterSection({
  isLoading,
  isAiSearching,
  name,
  email,
  phone,
  location,
  nameOperator,
  emailOperator,
  phoneOperator,
  locationOperator,
  skills,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
  onNameOperatorChange,
  onEmailOperatorChange,
  onPhoneOperatorChange,
  onLocationOperatorChange,
  onSkillsChange,
  onNameFocus,
  onNameBlur,
  onLocationFocus,
  onLocationBlur,
  onApply,
  onScheduleSkillsApply,
  onReset,
}: ApplicantDesktopInfoFilterSectionProps) {
  const disabled = isLoading || isAiSearching;
  const sharedGridClassName = "grid grid-cols-3 gap-2 w-full";
  const sharedOperatorClassName = "h-8 text-xs w-full col-span-1";

  return (
    <Accordion type="multiple" defaultValue={["Applicant-info"]} className="w-full">
      <AccordionItem value="Applicant-info" className="border-b border-border/50">
        <AccordionTrigger className="px-6 py-3 hover:no-underline rounded-none pl-6 pr-6">
          <ApplicantFilterSectionHeader
            icon={<User className="w-4 h-4 text-muted-foreground" />}
            title="Applicant Information"
            onReset={onReset}
            disabled={disabled}
          />
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 overflow-visible">
          <div className="space-y-2">
            <ApplicantTextFilterField
              id="name-search"
              label="Name"
              value={name}
              onValueChange={onNameChange}
              operator={nameOperator}
              onOperatorChange={onNameOperatorChange}
              placeholder="Filter by name..."
              onFocus={onNameFocus}
              onBlur={onNameBlur}
              onEnter={onApply}
              gridClassName={sharedGridClassName}
              operatorTriggerClassName={sharedOperatorClassName}
            />
            <ApplicantTextFilterField
              id="email-search"
              label="Email"
              value={email}
              onValueChange={onEmailChange}
              operator={emailOperator}
              onOperatorChange={onEmailOperatorChange}
              placeholder="Filter by email..."
              disabled={disabled}
              onEnter={onApply}
              gridClassName={sharedGridClassName}
              operatorTriggerClassName={sharedOperatorClassName}
            />
            <ApplicantTextFilterField
              id="phone-search"
              label="Phone"
              value={phone}
              onValueChange={onPhoneChange}
              operator={phoneOperator}
              onOperatorChange={onPhoneOperatorChange}
              placeholder="Filter by phone..."
              disabled={disabled}
              onEnter={onApply}
              gridClassName={sharedGridClassName}
              operatorTriggerClassName={sharedOperatorClassName}
            />
            <ApplicantTextFilterField
              id="location-search"
              label="Location"
              value={location}
              onValueChange={onLocationChange}
              operator={locationOperator}
              onOperatorChange={onLocationOperatorChange}
              placeholder="e.g., Bangkok, Thailand..."
              disabled={disabled}
              includeOtherOperator
              onFocus={onLocationFocus}
              onBlur={onLocationBlur}
              onEnter={onApply}
              gridClassName={sharedGridClassName}
              operatorTriggerClassName={sharedOperatorClassName}
            />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="skills-search" className="text-xs font-medium">Skills Keywords</Label>
            <ApplicantSkillsInput
              skills={skills}
              onSkillsChange={onSkillsChange}
              inputId="skills-tag-input"
              placeholder="e.g., React, Python, AWS..."
              disabled={disabled}
              containerClassName="flex flex-wrap items-center gap-1 mt-1 min-h-[40px] border px-2 py-1 bg-background focus-within:ring-2 focus-within:ring-ring"
              inputClassName="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm py-1 px-2 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              focusOnContainerClick
              scheduleApply={onScheduleSkillsApply}
              onApply={onApply}
              submitOnEnter
              allowTabToAdd
              allowBackspaceRemove
              allowPasteMerge
              removableButton
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
