"use client";

import { Badge } from "@/components/ui/badge";
import { CardCustomizationSettings } from "@/components/tasks/CardCustomizationSettings";
import type { TaskBoardPreferences } from "@/hooks/use-user-preferences";

import { ResetOptionsCard, SettingsSummaryCard, SummaryRow } from "./UserPreferencesPageShared";

type TaskBoardPreferencesTabProps = {
  preferences: TaskBoardPreferences;
  onUpdatePreferences: (updates: Partial<TaskBoardPreferences>) => void;
  onReset: () => void;
};

export function TaskBoardPreferencesTab({
  preferences,
  onUpdatePreferences,
  onReset,
}: TaskBoardPreferencesTabProps) {
  return (
    <div className="space-y-4">
      <CardCustomizationSettings
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
        onResetPreferences={onReset}
        isSaving={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SettingsSummaryCard
          title="Current Settings"
          description="Overview of your current task board configuration"
          onReset={onReset}
        >
          <SummaryRow label="View Mode">
            <Badge variant="secondary">{preferences.viewMode}</Badge>
          </SummaryRow>
          <SummaryRow label="Search Term">
            <Badge variant="secondary">{preferences.searchTerm || "None"}</Badge>
          </SummaryRow>
          <SummaryRow label="Priority Filter">
            <Badge variant="secondary">{preferences.filterPriority}</Badge>
          </SummaryRow>
          <SummaryRow label="Assignee Filter">
            <Badge variant="secondary">{preferences.filterAssignee}</Badge>
          </SummaryRow>
          <SummaryRow label="Selected Stages">
            <Badge variant="secondary">{preferences.selectedStages.length} stage(s)</Badge>
          </SummaryRow>
        </SettingsSummaryCard>

        <ResetOptionsCard
          title="Reset Options"
          description="Reset your task board preferences to default values"
          warningTitle="Reset Task Board Settings"
          warningBody="This will reset all your task board preferences to their default values. This action cannot be undone."
          actionLabel="Reset Task Board Preferences"
          onReset={onReset}
        />
      </div>
    </div>
  );
}
