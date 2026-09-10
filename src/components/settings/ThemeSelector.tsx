"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  themePreference: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  className?: string;
}

export function ThemeSelector({ themePreference, onThemeChange, className }: ThemeSelectorProps) {
  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Use light theme',
      icon: Sun,
      preview: 'bg-white border border-gray-200',
      iconClassName: 'text-amber-600',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Use dark theme',
      icon: Moon,
      preview: 'bg-gray-900 border border-gray-700',
      iconClassName: 'text-slate-100',
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Follow system preference',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-white to-gray-900 border border-gray-300',
      iconClassName: 'text-primary drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]',
    },
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Theme Preference
        </CardTitle>
        <CardDescription>
          Choose your preferred theme. System will automatically follow your device's theme setting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={themePreference}
          onValueChange={(value) => onThemeChange(value as 'light' | 'dark' | 'system')}
          className="grid grid-cols-1 gap-4"
        >
          {themes.map((theme) => {
            const Icon = theme.icon;
            return (
              <div key={theme.value}>
                <RadioGroupItem
                  value={theme.value}
                  id={theme.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={theme.value}
                  className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  <div className={cn(
                    "w-12 h-8 rounded-md border-2 flex items-center justify-center",
                    theme.preview
                  )}>
                    <Icon className={cn("h-4 w-4", theme.iconClassName)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{theme.label}</div>
                    <div className="text-sm text-muted-foreground">{theme.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
