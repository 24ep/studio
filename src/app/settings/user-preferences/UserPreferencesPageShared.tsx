"use client";

import type { ReactNode } from "react";
import { Accessibility, AlertCircle, Database, Filter, Layout, Loader2, Palette, RotateCcw, Settings, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";

import type { UserPreferencesTab, UserPreferencesTabConfig } from "./UserPreferencesPageTypes";

const USER_PREFERENCE_TABS: UserPreferencesTabConfig[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "taskboard", label: "Task Board", icon: Layout },
  { id: "positions", label: "Positions", icon: Filter },
  { id: "sidebar", label: "Sidebar", icon: Layout },
  { id: "security", label: "Security", icon: ShieldCheck },
];

type UserPreferencesHeaderProps = {
  onResetAll: () => void;
};

export function UserPreferencesHeader({ onResetAll }: UserPreferencesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">User Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your experience and manage your personal settings
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Database className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">Database Storage</span>
          <Badge variant="secondary" className="text-xs">
            Synced across devices
          </Badge>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={onResetAll}
        className="flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset All
      </Button>
    </div>
  );
}

type UserPreferencesTabsProps = {
  activeTab: UserPreferencesTab;
  onTabChange: (tab: UserPreferencesTab) => void;
};

export function UserPreferencesTabs({ activeTab, onTabChange }: UserPreferencesTabsProps) {
  return (
    <div className="flex w-full gap-4 overflow-x-auto border-b border-border/50 sm:gap-6" role="tablist" aria-label="User preference sections">
      {USER_PREFERENCE_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          role="tab"
          aria-selected={activeTab === id}
          className={cn(
            getUnderlineNavTriggerClassName(activeTab === id),
            "px-1 h-12",
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

type UserPreferencesStatusStateProps = {
  message: string;
};

export function UserPreferencesLoadingState({ message }: UserPreferencesStatusStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export function UserPreferencesAuthRequiredState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">
          You need to be signed in to manage your preferences. Your preferences are stored securely in the database and synced across all your devices.
        </p>
      </div>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  children: ReactNode;
};

export function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

type SettingsSummaryCardProps = {
  title: string;
  description: string;
  onReset?: () => void;
  children: ReactNode;
};

export function SettingsSummaryCard({ title, description, onReset, children }: SettingsSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

type ResetOptionsCardProps = {
  title: string;
  description: string;
  warningTitle: string;
  warningBody: string;
  actionLabel: string;
  onReset: () => void;
};

export function ResetOptionsCard({
  title,
  description,
  warningTitle,
  warningBody,
  actionLabel,
  onReset,
}: ResetOptionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {warningTitle}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {warningBody}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onReset} className="w-full">
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
