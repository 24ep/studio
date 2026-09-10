"use client";

import { User } from "lucide-react";

import { PersonalColorPicker } from "@/components/settings/PersonalColorPicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import type {
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";

export function UserPreferencesAppearanceTab({
  actions,
  preferences,
}: {
  actions: UserPreferencesActions;
  preferences: UserPreferences;
}) {
  return (
    <TabsContent value="appearance" className="space-y-6 p-6 mt-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalColorPicker
          personalColor={preferences.appearance.personalColor}
          onColorChange={(color) =>
            actions.updateAppearancePreferences({ personalColor: color })
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Image
            </CardTitle>
            <CardDescription>
              Manage your profile image and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Profile image management will be available here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
