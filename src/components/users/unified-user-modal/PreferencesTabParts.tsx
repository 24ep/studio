import { Button } from '@/components/ui/button';
import type React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { CardCustomizationSettings } from '@/components/tasks/CardCustomizationSettings';
import type { UserPreferences } from '@/hooks/use-user-preferences';
import { defaultTaskBoardPreferences } from '@/hooks/user-preferences-defaults';
import { Layout, Monitor, Moon, Palette, Sun } from 'lucide-react';
import type { UnifiedUserPreferenceUpdates } from './types';

export function PreferencesInterfaceSettings({
  handleResetPreference,
  isPrefsLoading,
  preferences,
  saveSidebarPref,
  sidebarShowAssigned,
  updatePreferenceInDB,
}: {
  handleResetPreference: (modelType: string) => Promise<void>;
  isPrefsLoading: boolean;
  preferences: UserPreferences | null;
  saveSidebarPref: (checked: boolean) => Promise<void>;
  sidebarShowAssigned: boolean;
  updatePreferenceInDB: (modelType: string, updates: UnifiedUserPreferenceUpdates) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <PreferencesSectionHeading icon={<Palette className="h-5 w-5 text-primary" />} title="Interface Settings" />

      <div className="space-y-4 px-2">
        <PreferencesThemeField
          preferences={preferences}
          updatePreferenceInDB={updatePreferenceInDB}
        />

        <Separator className="opacity-50" />

        <PreferencesSidebarField
          handleResetPreference={handleResetPreference}
          isPrefsLoading={isPrefsLoading}
          saveSidebarPref={saveSidebarPref}
          sidebarShowAssigned={sidebarShowAssigned}
        />
      </div>
    </div>
  );
}

export function PreferencesTaskBoardCards({
  handleResetPreference,
  preferences,
  updatePreferenceInDB,
}: {
  handleResetPreference: (modelType: string) => Promise<void>;
  preferences: UserPreferences | null;
  updatePreferenceInDB: (modelType: string, updates: UnifiedUserPreferenceUpdates) => Promise<void>;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <PreferencesSectionHeading icon={<Layout className="h-5 w-5 text-primary" />} title="Task Board Cards" />
      <div className="px-2">
        <CardCustomizationSettings
          preferences={preferences?.taskBoard || defaultTaskBoardPreferences}
          onUpdatePreferences={(updates) => updatePreferenceInDB('taskBoard', updates)}
          onResetPreferences={() => handleResetPreference('taskBoard')}
        />
      </div>
    </div>
  );
}

function PreferencesSectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h3>
    </div>
  );
}

function PreferencesThemeField({
  preferences,
  updatePreferenceInDB,
}: {
  preferences: UserPreferences | null;
  updatePreferenceInDB: (modelType: string, updates: UnifiedUserPreferenceUpdates) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] items-center gap-2 md:gap-8 space-y-0">
      <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Monitor className="h-4 w-4" /> Color Theme
      </Label>
      <Select
        value={preferences?.appearance?.themePreference || 'system'}
        onValueChange={(value: 'light' | 'dark' | 'system') => updatePreferenceInDB('appearance', { themePreference: value })}
      >
        <SelectTrigger className="w-full md:max-w-xs bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light Theme</span>
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark Theme</span>
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>System Default</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function PreferencesSidebarField({
  handleResetPreference,
  isPrefsLoading,
  saveSidebarPref,
  sidebarShowAssigned,
}: {
  handleResetPreference: (modelType: string) => Promise<void>;
  isPrefsLoading: boolean;
  saveSidebarPref: (checked: boolean) => Promise<void>;
  sidebarShowAssigned: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] items-center gap-2 md:gap-8 space-y-0">
      <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Layout className="h-4 w-4" /> Sidebar Style
      </Label>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show Assigned Positions Only</Label>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Only show positions where you are part of the hiring team
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Switch
            checked={sidebarShowAssigned}
            onCheckedChange={(checked) => saveSidebarPref(Boolean(checked))}
            disabled={isPrefsLoading}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] px-2 uppercase font-bold tracking-tight text-muted-foreground hover:text-foreground"
            onClick={() => handleResetPreference('sidebar')}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
