"use client";

import { Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemSettingsHeaderProps {
  showLogoOnly: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function SystemSettingsHeader({
  showLogoOnly,
  isSaving,
  onReset,
  onSave,
}: SystemSettingsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        {!showLogoOnly && (
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        )}
        <p className="text-muted-foreground">Configure system integrations, AI services, and automation workflows</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          variant="default"
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
