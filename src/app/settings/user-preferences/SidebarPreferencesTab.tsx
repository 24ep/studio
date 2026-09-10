"use client";

import { Layout, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SidebarPreferences } from "@/hooks/use-user-preferences";

type SidebarPreferencesTabProps = {
  preferences: SidebarPreferences;
  onUpdatePreferences: (updates: Partial<SidebarPreferences>) => void;
  onReset: () => void;
};

export function SidebarPreferencesTab({
  preferences,
  onUpdatePreferences,
  onReset,
}: SidebarPreferencesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Sidebar Preferences
          </CardTitle>
          <CardDescription>
            Customize how your sidebar displays information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showAssignedPositions" className="text-sm font-medium">
                Show Assigned Positions
              </Label>
              <p className="text-sm text-muted-foreground">
                Display your assigned open positions in the main sidebar with headcount information
              </p>
            </div>
            <Switch
              id="showAssignedPositions"
              checked={preferences.showAssignedPositions}
              onCheckedChange={(checked) => onUpdatePreferences({ showAssignedPositions: checked })}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Sidebar Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
