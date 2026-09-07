"use client";

import { Moon, RotateCcw, Settings2, Sun } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ThemePreference } from "./system-preferences/constants";
import type { SystemPreferencesBasicSettingsCardProps } from "./SystemPreferencesFormTypes";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: React.ElementType;
  iconClassName: string;
}> = [
  { value: "light", label: "Light", icon: Sun, iconClassName: "text-amber-500" },
  { value: "dark", label: "Dark", icon: Moon, iconClassName: "text-blue-400" },
  { value: "system", label: "System", icon: RotateCcw, iconClassName: "text-muted-foreground" },
];

export function SystemPreferencesBasicSettingsCard({
  appName,
  onAppNameChange,
  themePreference,
  onThemePreferenceChange,
}: SystemPreferencesBasicSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Basic Settings
        </CardTitle>
        <CardDescription>
          Configure application defaults. Signed-in users control their personal appearance from the user menu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appName">Application Name</Label>
          <Input
            id="appName"
            value={appName}
            onChange={event => onAppNameChange(event.target.value)}
            placeholder="Enter application name"
          />
        </div>

        <div className="space-y-2">
          <div>
            <Label>Default theme</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Used for public and default application surfaces when no personal theme preference is available.
            </p>
          </div>
          <RadioGroup
            value={themePreference}
            onValueChange={value => onThemePreferenceChange(value as ThemePreference)}
            className="flex flex-wrap gap-4"
          >
            {THEME_OPTIONS.map(({ value, label, icon: Icon, iconClassName }) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`default-theme-${value}`} />
                <Label htmlFor={`default-theme-${value}`} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${iconClassName}`} />
                  <span className="text-sm">{label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
