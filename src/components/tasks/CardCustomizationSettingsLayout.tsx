"use client";

import { RotateCcw, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';
import {
  CARD_CUSTOMIZATION_TABS,
  type CardCustomizationTab,
} from './CardCustomizationSettingsConfig';

export function CardCustomizationScrollbarStyle() {
  return (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.5);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: hsl(var(--muted-foreground) / 0.7);
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
      }
    `}</style>
  );
}

interface CardCustomizationTabsProps {
  activeTab: CardCustomizationTab;
  onActiveTabChange: (tab: CardCustomizationTab) => void;
}

export function CardCustomizationTabs({
  activeTab,
  onActiveTabChange,
}: CardCustomizationTabsProps) {
  return (
    <div className="flex w-full border-b border-border/50 mb-6 flex-shrink-0">
      {CARD_CUSTOMIZATION_TABS.map(tab => {
        const Icon = tab.icon;
        const active = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onActiveTabChange(tab.value)}
            className={cn(
              getUnderlineNavTriggerClassName(active),
              'px-6 py-3',
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface CardCustomizationFooterProps {
  hasChanges: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function CardCustomizationFooter({
  hasChanges,
  isSaving,
  onReset,
  onSave,
}: CardCustomizationFooterProps) {
  return (
    <div className="flex justify-between items-center pt-4 border-t mt-4 flex-shrink-0">
      <Button
        onClick={onReset}
        disabled={isSaving}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>
      <Button
        onClick={onSave}
        disabled={!hasChanges || isSaving}
        size="sm"
        className="flex items-center gap-2"
      >
        <Save className="h-3 w-3" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
