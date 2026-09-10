"use client";

import { Layout } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

import type {
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";

export function UserPreferencesSidebarTab({
  actions,
  preferences,
}: {
  actions: UserPreferencesActions;
  preferences: UserPreferences;
}) {
  return (
    <TabsContent value="sidebar" className="space-y-6 p-6 mt-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Sidebar Preferences
          </CardTitle>
          <CardDescription>
            Configure sidebar display and information preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="modal-showAssignedPositions" className="text-sm font-medium">
                Show Assigned Positions
              </Label>
              <p className="text-sm text-muted-foreground">
                Display assigned open positions in the main sidebar with headcount information
              </p>
            </div>
            <Switch
              id="modal-showAssignedPositions"
              checked={preferences.sidebar.showAssignedPositions || false}
              onCheckedChange={(checked) =>
                actions.updateSidebarPreferences({
                  showAssignedPositions: checked,
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
