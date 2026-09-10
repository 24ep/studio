"use client";

import { ClockIcon as Clock } from "@heroicons/react/24/outline";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { ApplicantFilterSectionHeader } from "./ApplicantFilterSectionHeader";

interface ApplicantDesktopExperienceFilterSectionProps {
  isLoading?: boolean;
  isAiSearching?: boolean;
  range: [number, number];
  onRangeChange: (range: [number, number]) => void;
  onNoExperienceToggle: (checked: boolean) => void;
  onReset: () => void;
}

export function ApplicantDesktopExperienceFilterSection({
  isLoading,
  isAiSearching,
  range,
  onRangeChange,
  onNoExperienceToggle,
  onReset,
}: ApplicantDesktopExperienceFilterSectionProps) {
  const disabled = isLoading || isAiSearching;
  const minYears = range[0];
  const maxYears = range[1];
  const includesNoExperience = minYears === -1;

  const handleMinChange = (valueText: string) => {
    const value = valueText === "" ? 0 : parseInt(valueText);
    if (!Number.isNaN(value) && value >= 0 && value <= 50) {
      onRangeChange([value, Math.max(value, maxYears)]);
    }
  };

  const handleMaxChange = (valueText: string) => {
    const value = valueText === "" ? 50 : parseInt(valueText);
    if (!Number.isNaN(value) && value >= 0 && value <= 50) {
      const currentMin = includesNoExperience ? 0 : minYears;
      onRangeChange([Math.min(currentMin, value), value]);
    }
  };

  return (
    <Accordion type="multiple" defaultValue={["experience"]} className="w-full">
      <AccordionItem value="experience" className="border-b border-border/50">
        <AccordionTrigger className="px-6 py-3 hover:no-underline rounded-none pl-6 pr-6">
          <ApplicantFilterSectionHeader
            icon={<Clock className="w-4 h-4 text-muted-foreground" />}
            title="Experience"
            onReset={onReset}
            disabled={disabled}
          />
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-2">
            <div>
              <Label className="text-xs font-medium pt-2">Experience Years</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={includesNoExperience ? "" : minYears}
                      onChange={(event) => handleMinChange(event.target.value)}
                      placeholder="Min"
                      className="h-8 text-xs"
                      disabled={disabled || includesNoExperience}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">to</span>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={maxYears}
                      onChange={(event) => handleMaxChange(event.target.value)}
                      placeholder="Max"
                      className="h-8 text-xs"
                      disabled={disabled}
                    />
                  </div>
                </div>
                <span className="text-xs w-20 text-muted-foreground">
                  {includesNoExperience ? "No exp" : minYears}-{maxYears} years
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="no-experience-checkbox"
                  checked={includesNoExperience}
                  onChange={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onNoExperienceToggle(event.target.checked);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  disabled={disabled}
                  className="border-border text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="no-experience-checkbox"
                  className="text-xs text-muted-foreground cursor-pointer"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  Include Applicants with no experience listed
                </Label>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
