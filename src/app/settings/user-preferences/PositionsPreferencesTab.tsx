"use client";

import { Badge } from "@/components/ui/badge";
import type { PositionsPreferences } from "@/hooks/use-user-preferences";

import { ResetOptionsCard, SettingsSummaryCard, SummaryRow } from "./UserPreferencesPageShared";

type PositionsPreferencesTabProps = {
  preferences: PositionsPreferences;
  onReset: () => void;
};

export function PositionsPreferencesTab({ preferences, onReset }: PositionsPreferencesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SettingsSummaryCard
        title="Current Settings"
        description="Overview of your current positions configuration"
        onReset={onReset}
      >
        <SummaryRow label="Search Term">
          <Badge variant="secondary">{preferences.searchTerm || "None"}</Badge>
        </SummaryRow>
        <SummaryRow label="Department Filter">
          <Badge variant="secondary">{preferences.departmentFilter}</Badge>
        </SummaryRow>
        <SummaryRow label="Status Filter">
          <Badge variant="secondary">{preferences.statusFilter}</Badge>
        </SummaryRow>
        <SummaryRow label="Selected Recruiter">
          <Badge variant="secondary">{preferences.selectedRecruiterId || "None"}</Badge>
        </SummaryRow>
        <SummaryRow label="Page Size">
          <Badge variant="secondary">{preferences.pageSize} items</Badge>
        </SummaryRow>
        <SummaryRow label="Sort By">
          <Badge variant="secondary">{preferences.sortBy}</Badge>
        </SummaryRow>
        <SummaryRow label="Sort Order">
          <Badge variant="secondary">{preferences.sortOrder}</Badge>
        </SummaryRow>
      </SettingsSummaryCard>

      <ResetOptionsCard
        title="Reset Options"
        description="Reset your positions preferences to default values"
        warningTitle="Reset Positions Settings"
        warningBody="This will reset all your positions preferences to their default values. This action cannot be undone."
        actionLabel="Reset Positions Preferences"
        onReset={onReset}
      />
    </div>
  );
}
