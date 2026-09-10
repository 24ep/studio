"use client";

import {
  FileText,
  Hash,
  ListChecks,
  Target,
  UserCog,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";

export type PositionDetailTabId =
  | "details"
  | "job-description"
  | "criteria"
  | "Applicants"
  | "headcount"
  | "hiring-managers"
  | "evaluation"
  | "existing-employees";

interface PositionDetailTabsNavProps {
  activeTab: PositionDetailTabId;
  applicantsCount: number;
  headcountsTotal: number;
  onTabChange: (tab: PositionDetailTabId) => void;
}

interface PositionDetailTabDefinition {
  id: PositionDetailTabId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function getPositionDetailTabs(applicantsCount: number, headcountsTotal: number): PositionDetailTabDefinition[] {
  return [
    { id: "details", label: "Details", icon: FileText },
    { id: "job-description", label: "Job Description", icon: FileText },
    { id: "criteria", label: "AI Match Criteria", icon: ListChecks },
    { id: "Applicants", label: `Applicants (${applicantsCount})`, icon: Users },
    { id: "headcount", label: `Headcount (${headcountsTotal})`, icon: Hash },
    { id: "hiring-managers", label: "Hiring Manager", icon: UserCog },
    { id: "evaluation", label: "Evaluate", icon: Target },
    { id: "existing-employees", label: "Existing Employees", icon: Users },
  ];
}

export function PositionDetailTabsNav({
  activeTab,
  applicantsCount,
  headcountsTotal,
  onTabChange,
}: PositionDetailTabsNavProps) {
  return (
    <div className="border-b border-border/50 bg-background w-full flex-shrink-0 sticky top-0 z-10 overflow-x-auto no-scrollbar">
      <div className="flex flex-row min-w-max px-6 gap-6">
        {getPositionDetailTabs(applicantsCount, headcountsTotal).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              getUnderlineNavTriggerClassName(activeTab === id),
              "whitespace-nowrap h-12 px-1",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
