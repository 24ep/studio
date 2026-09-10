"use client";

import { Check, Loader2 } from "lucide-react";

interface SystemPreferencesHeaderProps {
  showLogoOnly: boolean;
  saving: boolean;
  saveConfirmed: boolean;
  canEdit: boolean;
  onSave: () => void;
}

export function SystemPreferencesHeader({
  showLogoOnly,
  saving,
  saveConfirmed,
}: SystemPreferencesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        {!showLogoOnly && (
          <h1 className="text-2xl font-bold text-foreground">System Preferences</h1>
        )}
        <p className="text-muted-foreground">Manage application appearance, branding, and global settings</p>
      </div>
      {saving && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving
        </span>
      )}
      {!saving && saveConfirmed && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Saved
        </span>
      )}
    </div>
  );
}
