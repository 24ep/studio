"use client";

import { Kanban, List, Settings, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BoardHeaderActionsProps {
  hasNetworkError: boolean;
  onOpenCardSettings: () => void;
  onOpenNetworkDiagnostics: () => void;
  onViewModeChange: (viewMode: string) => void;
  showViewSwitcher?: boolean;
  viewMode: "kanban" | "table";
}

export function BoardHeaderActions({
  hasNetworkError,
  onOpenCardSettings,
  onOpenNetworkDiagnostics,
  onViewModeChange,
  showViewSwitcher = true,
  viewMode,
}: BoardHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-2"
        onClick={onOpenCardSettings}
        title="Customize card display"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {showViewSwitcher && (
        <Tabs
          value={viewMode}
          onValueChange={onViewModeChange}
          className="w-auto"
        >
          <TabsList variant="subnav" className="grid w-auto grid-cols-2 h-9">
            <TabsTrigger value="kanban" className="text-xs px-2">
              <Kanban className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs px-2">
              <List className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {hasNetworkError && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          onClick={onOpenNetworkDiagnostics}
          title="Network diagnostics"
        >
          <Wifi className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
