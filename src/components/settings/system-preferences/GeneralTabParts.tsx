import React from 'react';
import { Moon, RotateCcw, Sun } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemePreference } from './constants';
import { SystemPreferenceRow, SystemPreferenceSection } from './SystemPreferenceRows';
import {
  APP_NAME_HELP_TEXT,
  GENERATIVE_AI_CANVAS_HELP_TEXT,
  THEME_PREFERENCE_HELP_TEXT,
  THEME_PREFERENCE_OPTIONS,
  type ThemePreferenceIconKey,
} from './general-tab-utils';

export function GeneralTabAppNameCard({
  appName,
  canEdit,
  setAppName,
}: {
  appName: string;
  canEdit: boolean;
  setAppName: (value: string) => void;
}) {
  return (
    <section className="border-b border-border/60 py-5 sm:py-6">
      <SystemPreferenceRow
        htmlFor="app-name-input"
        label="Application Name"
        description={APP_NAME_HELP_TEXT}
      >
        <Input
          id="app-name-input"
          type="text"
          value={appName}
          onChange={(event) => setAppName(event.target.value)}
          placeholder="e.g., hrive Pro"
          disabled={!canEdit}
        />
      </SystemPreferenceRow>
    </section>
  );
}

export function GeneralTabThemeCard({
  canEdit,
  setThemePreference,
  themePreference,
}: {
  canEdit: boolean;
  setThemePreference: (value: ThemePreference) => void;
  themePreference: ThemePreference;
}) {
  return (
    <SystemPreferenceSection
      title="Theme"
      description="Configure the default theme for new users."
    >
      <SystemPreferenceRow
        htmlFor="theme-preference"
        label="Default Theme"
        description={THEME_PREFERENCE_HELP_TEXT}
      >
        <Select
          value={themePreference}
          onValueChange={(value) => setThemePreference(value as ThemePreference)}
          disabled={!canEdit}
        >
          <SelectTrigger id="theme-preference" className="w-full">
            <SelectValue placeholder="Select default theme" />
          </SelectTrigger>
          <SelectContent>
            {THEME_PREFERENCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <ThemePreferenceIcon icon={option.icon} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SystemPreferenceRow>
    </SystemPreferenceSection>
  );
}

export function GeneralTabDefaultLanguageCard({
  canEdit,
  defaultLanguage,
  setDefaultLanguage,
}: {
  canEdit: boolean;
  defaultLanguage: string;
  setDefaultLanguage: (value: string) => void;
}) {
  const normalizedDefaultLanguage = defaultLanguage.toLowerCase().startsWith("th") ? "th" : "en";

  return (
    <SystemPreferenceSection
      title="Default Language"
      description="Choose the default locale used when no user preference is stored."
    >
      <SystemPreferenceRow
        htmlFor="default-language"
        label="Default Language"
        description="Only applies when a user has not already selected a preferred language."
      >
        <Select
          value={normalizedDefaultLanguage}
          onValueChange={setDefaultLanguage}
          disabled={!canEdit}
        >
          <SelectTrigger id="default-language" className="w-full">
            <SelectValue placeholder="Select default language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="th">ไทย</SelectItem>
          </SelectContent>
        </Select>
      </SystemPreferenceRow>
    </SystemPreferenceSection>
  );
}

export function GeneralTabGenerativeAiCard({
  canEdit,
  generativeAICanvasMode,
  setGenerativeAICanvasMode,
}: {
  canEdit: boolean;
  generativeAICanvasMode: boolean;
  setGenerativeAICanvasMode: (value: boolean) => void;
}) {
  return (
    <SystemPreferenceSection
      title="Generative AI Assistant"
      description="Configure advanced features for the Generative AI Assistant."
    >
      <SystemPreferenceRow
        htmlFor="generative-ai-canvas-mode"
        label="Canvas Mode"
        description={GENERATIVE_AI_CANVAS_HELP_TEXT}
      >
        <div className="flex justify-end">
          <Switch
            id="generative-ai-canvas-mode"
            checked={generativeAICanvasMode}
            onCheckedChange={setGenerativeAICanvasMode}
            disabled={!canEdit}
          />
        </div>
      </SystemPreferenceRow>
    </SystemPreferenceSection>
  );
}

function ThemePreferenceIcon({ icon }: { icon: ThemePreferenceIconKey }) {
  const themeOptionIcons: Record<ThemePreferenceIconKey, React.ReactNode> = {
    sun: <Sun className="h-4 w-4" />,
    moon: <Moon className="h-4 w-4" />,
    system: <RotateCcw className="h-4 w-4" />,
  };

  return themeOptionIcons[icon];
}
