"use client";

import type { ComponentProps } from "react";
import {
  FunnelIcon as Filter,
  FunnelIcon as FilterX,
} from "@heroicons/react/24/outline";

import { AdvancedQuerySyntaxModal } from "./AdvancedQuerySyntaxModal";
import { ApplicantFilterActionBar } from "./ApplicantFilterActionBar";
import { ApplicantFilterTabs, type ApplicantFilterTab } from "./ApplicantFilterTabs";
import { ApplicantFiltersAdvancedTab } from "./ApplicantFiltersAdvancedTab";
import { ApplicantFiltersDesktopPanel } from "./ApplicantFiltersDesktopPanel";
import { ApplicantFiltersMobileContent } from "./ApplicantFiltersMobileContent";

interface ApplicantFiltersViewProps {
  activeTab: ApplicantFilterTab;
  advancedTabProps?: ComponentProps<typeof ApplicantFiltersAdvancedTab>;
  className?: string;
  desktopPanelProps?: ComponentProps<typeof ApplicantFiltersDesktopPanel>;
  isAdvancedQuerySyntaxModalOpen: boolean;
  isMobile: boolean;
  mobileContentProps?: ComponentProps<typeof ApplicantFiltersMobileContent>;
  showActionButtons: boolean;
  onApplyStandardFilters: () => void;
  onClearAllFilters: () => void;
  onAdvancedSyntaxOpenChange: (open: boolean) => void;
  onTabChange: (tab: ApplicantFilterTab) => void;
}

export function ApplicantFiltersView({
  activeTab,
  advancedTabProps,
  className,
  desktopPanelProps,
  isAdvancedQuerySyntaxModalOpen,
  isMobile,
  mobileContentProps,
  showActionButtons,
  onApplyStandardFilters,
  onClearAllFilters,
  onAdvancedSyntaxOpenChange,
  onTabChange,
}: ApplicantFiltersViewProps) {
  if (isMobile && mobileContentProps) {
    return <ApplicantFiltersMobileContent {...mobileContentProps} />;
  }

  return (
    <div className={["space-y-0 Applicant-filters", className].filter(Boolean).join(" ")}>
      <div className="bg-card overflow-hidden border-t border-border/50">
        <div>
          <ApplicantFilterTabs activeTab={activeTab} onTabChange={onTabChange} />

          {activeTab === "filters" && desktopPanelProps && (
            <ApplicantFiltersDesktopPanel {...desktopPanelProps} />
          )}

          {activeTab === "advanced" && advancedTabProps && (
            <ApplicantFiltersAdvancedTab {...advancedTabProps} />
          )}
        </div>
      </div>

      {showActionButtons && (
        <ApplicantFilterActionBar
          primaryLabel="Apply Filters"
          secondaryLabel="Clear All"
          onPrimary={onApplyStandardFilters}
          onSecondary={onClearAllFilters}
          primaryIcon={Filter}
          secondaryIcon={FilterX}
          secondaryFirst
          className="p-4 border-t mt-auto sticky bottom-0 bg-background z-10"
        />
      )}

      <AdvancedQuerySyntaxModal
        isOpen={isAdvancedQuerySyntaxModalOpen}
        onOpenChange={onAdvancedSyntaxOpenChange}
      />
    </div>
  );
}
