"use client";

import { Layout } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import { UserPreferenceSelect } from "./UserPreferenceSelect";
import type {
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";

const TASK_BOARD_VIEW_OPTIONS = [
  { label: "Kanban Board", value: "kanban" },
  { label: "Table View", value: "table" },
];

const TASK_BOARD_PRIORITY_OPTIONS = [
  { label: "All Priorities", value: "all" },
  { label: "High Priority", value: "high" },
  { label: "Medium Priority", value: "medium" },
  { label: "Low Priority", value: "low" },
];

const TASK_BOARD_ASSIGNEE_OPTIONS = [
  { label: "All Assignees", value: "all" },
  { label: "Assigned to Me", value: "me" },
  { label: "Unassigned", value: "unassigned" },
];

export function UserPreferencesTaskBoardTab({
  actions,
  preferences,
}: {
  actions: UserPreferencesActions;
  preferences: UserPreferences;
}) {
  return (
    <TabsContent value="taskBoard" className="space-y-6 p-6 mt-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Task Board Preferences
          </CardTitle>
          <CardDescription>
            Configure task board display and filtering preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <UserPreferenceSelect
              id="view-mode"
              label="Default View Mode"
              value={preferences.taskBoard.viewMode}
              onChange={(value) =>
                actions.updateTaskBoardPreferences({
                  viewMode: value as "kanban" | "table",
                })
              }
              options={TASK_BOARD_VIEW_OPTIONS}
            />
            <UserPreferenceSelect
              id="priority-filter"
              label="Default Priority Filter"
              value={preferences.taskBoard.filterPriority}
              onChange={(value) =>
                actions.updateTaskBoardPreferences({ filterPriority: value })
              }
              options={TASK_BOARD_PRIORITY_OPTIONS}
            />
            <UserPreferenceSelect
              id="assignee-filter"
              label="Default Assignee Filter"
              value={preferences.taskBoard.filterAssignee}
              onChange={(value) =>
                actions.updateTaskBoardPreferences({ filterAssignee: value })
              }
              options={TASK_BOARD_ASSIGNEE_OPTIONS}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
