"use client";

import { Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonalColorPicker } from "@/components/settings/PersonalColorPicker";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import type { AppearancePreferences } from "@/hooks/use-user-preferences";

import { SettingsSummaryCard, SummaryRow } from "./UserPreferencesPageShared";

type AppearancePreferencesTabProps = {
  preferences: AppearancePreferences;
  onColorChange: (color: string) => void;
  onThemeChange: (theme: AppearancePreferences["themePreference"]) => void;
  onReset: () => void;
};

export function AppearancePreferencesTab({
  preferences,
  onColorChange,
  onThemeChange,
  onReset,
}: AppearancePreferencesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ThemeSelector
        themePreference={preferences.themePreference}
        onThemeChange={onThemeChange}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personal Color
              </CardTitle>
              <CardDescription>
                Choose your personal color theme for UI elements
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PersonalColorPicker
            personalColor={preferences.personalColor}
            onColorChange={onColorChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <SettingsSummaryCard
        title="Current Settings"
        description="Overview of your current appearance configuration"
      >
        <SummaryRow label="Theme Preference">
          <Badge variant="secondary">{preferences.themePreference}</Badge>
        </SummaryRow>
        <SummaryRow label="Personal Color">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: preferences.personalColor }}
            />
            <Badge variant="secondary">{preferences.personalColor}</Badge>
          </div>
        </SummaryRow>
      </SettingsSummaryCard>
    </div>
  );
}
