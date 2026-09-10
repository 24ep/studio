"use client";

import * as React from "react";
import { Accessibility, Keyboard, Languages, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AccessibilityPreferences } from "@/hooks/use-user-preferences";
import { useLocalization } from '@/contexts/LocalizationContext';

export function AccessibilityPreferencesTab({
  preferences,
  onUpdate,
  onReset,
}: {
  preferences: AccessibilityPreferences;
  onUpdate: (updates: Partial<AccessibilityPreferences>) => void;
  onReset: () => void;
}) {
  const localization = useLocalization();
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accessibility-text-scale', `${preferences.textScale / 100}`);
    root.classList.toggle('a11y-contrast', preferences.increasedContrast);
    root.classList.toggle('a11y-reduced-motion', preferences.reducedMotion);
    root.classList.toggle('a11y-underline-links', preferences.underlineLinks);
    root.dataset.keyboardShortcuts = String(preferences.keyboardShortcuts);
    localization.setLocale(preferences.locale);
  }, [localization, preferences]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Accessibility className="h-5 w-5" />Reading and motion</CardTitle>
          <CardDescription>Adjust the workspace without changing business data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4"><Label htmlFor="text-scale">Text size</Label><output htmlFor="text-scale" className="text-sm font-medium">{preferences.textScale}%</output></div>
            <input id="text-scale" type="range" min="90" max="125" step="5" value={preferences.textScale} onChange={event => onUpdate({ textScale: Number(event.target.value) })} className="min-h-11 w-full accent-primary" />
          </div>
          <PreferenceCheck label="Increase contrast" description="Strengthen separation between text and surfaces." checked={preferences.increasedContrast} onChange={checked => onUpdate({ increasedContrast: checked })} />
          <PreferenceCheck label="Reduce motion" description="Minimize transitions and animated feedback." checked={preferences.reducedMotion} onChange={checked => onUpdate({ reducedMotion: checked })} />
          <PreferenceCheck label="Underline links" description="Make text links easier to distinguish without color." checked={preferences.underlineLinks} onChange={checked => onUpdate({ underlineLinks: checked })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5" />Language and keyboard</CardTitle>
          <CardDescription>Choose formatting preferences and optional productivity shortcuts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="preferred-locale">Locale</Label>
            <select id="preferred-locale" value={preferences.locale} onChange={event => onUpdate({ locale: event.target.value as AccessibilityPreferences['locale'] })} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="en-US">English (United States)</option>
              <option value="th-TH">ไทย (ประเทศไทย)</option>
            </select>
            <p className="text-xs text-muted-foreground">Used for supported date, number, and language-aware content.</p>
          </div>
          <PreferenceCheck icon={Keyboard} label="Keyboard shortcuts" description="Enable shortcuts such as Ctrl/⌘ + K for universal search." checked={preferences.keyboardShortcuts} onChange={checked => onUpdate({ keyboardShortcuts: checked })} />
          <Button variant="outline" className="min-h-11 w-full" onClick={onReset}><RotateCcw className="mr-2 h-4 w-4" />Reset accessibility preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceCheck({ label, description, checked, onChange, icon: Icon }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; icon?: React.ElementType }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-5 w-5 accent-primary" />
      {Icon && <Icon className="h-5 w-5 text-primary" aria-hidden="true" />}
      <span className="min-w-0"><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{description}</span></span>
    </label>
  );
}
