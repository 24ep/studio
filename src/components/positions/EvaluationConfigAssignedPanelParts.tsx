"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus } from "lucide-react";
import { EvaluationSearchInput } from "./EvaluationConfigTabParts";

type PanelIcon = React.ComponentType<{ className?: string }>;

interface AssignedPanelShellProps {
  assignedCount: number;
  children: React.ReactNode;
  icon: PanelIcon;
  searchPlaceholder: string;
  searchTerm: string;
  sheet: React.ReactNode;
  title: string;
  onSearchChange: (value: string) => void;
}

interface AssignedItemsEmptyStateProps {
  actionLabel: string;
  description: string;
  icon: PanelIcon;
  searchDescription: string;
  title: string;
  hasSearchTerm: boolean;
  iconClassName?: string;
  onAdd: () => void;
}

export function AssignedPanelShell({
  assignedCount,
  children,
  icon: Icon,
  searchPlaceholder,
  searchTerm,
  sheet,
  title,
  onSearchChange,
}: AssignedPanelShellProps): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary">{assignedCount} assigned</Badge>
        </div>
        {sheet}
      </div>

      <div className="mb-4">
        <EvaluationSearchInput
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      <ScrollArea className="flex-1 h-full">{children}</ScrollArea>
    </div>
  );
}

export function EvaluationItemsLoadingState(): React.ReactElement {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function AssignedItemsEmptyState({
  actionLabel,
  description,
  hasSearchTerm,
  icon: Icon,
  iconClassName = "h-12 w-12 text-muted-foreground mb-4",
  onAdd,
  searchDescription,
  title,
}: AssignedItemsEmptyStateProps): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className={iconClassName} />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {hasSearchTerm ? searchDescription : description}
        </p>
        {!hasSearchTerm && (
          <Button size="lg" onClick={onAdd} className="px-8 py-3">
            <Plus className="h-5 w-5 mr-2" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
