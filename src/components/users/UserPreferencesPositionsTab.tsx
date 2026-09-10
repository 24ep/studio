"use client";

import { Filter } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import { UserPreferenceSelect } from "./UserPreferenceSelect";
import type {
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";

const POSITION_PAGE_SIZE_OPTIONS = [
  { label: "10 items", value: "10" },
  { label: "20 items", value: "20" },
  { label: "50 items", value: "50" },
  { label: "100 items", value: "100" },
];

const POSITION_SORT_BY_OPTIONS = [
  { label: "Created Date", value: "createdAt" },
  { label: "Title", value: "title" },
  { label: "Department", value: "department" },
  { label: "Status", value: "status" },
];

const POSITION_SORT_ORDER_OPTIONS = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];

export function UserPreferencesPositionsTab({
  actions,
  preferences,
}: {
  actions: UserPreferencesActions;
  preferences: UserPreferences;
}) {
  return (
    <TabsContent value="positions" className="space-y-6 p-6 mt-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Positions Preferences
          </CardTitle>
          <CardDescription>
            Configure positions page display and filtering preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <UserPreferenceSelect
              id="page-size"
              label="Default Page Size"
              value={String(preferences.positions.pageSize)}
              onChange={(value) =>
                actions.updatePositionsPreferences({ pageSize: parseInt(value) })
              }
              options={POSITION_PAGE_SIZE_OPTIONS}
            />
            <UserPreferenceSelect
              id="sort-by"
              label="Default Sort By"
              value={preferences.positions.sortBy}
              onChange={(value) =>
                actions.updatePositionsPreferences({ sortBy: value })
              }
              options={POSITION_SORT_BY_OPTIONS}
            />
            <UserPreferenceSelect
              id="sort-order"
              label="Default Sort Order"
              value={preferences.positions.sortOrder}
              onChange={(value) =>
                actions.updatePositionsPreferences({
                  sortOrder: value as "asc" | "desc",
                })
              }
              options={POSITION_SORT_ORDER_OPTIONS}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
