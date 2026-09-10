"use client";

import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RolePermissionSelectorActions } from "./RolePermissionSelectorTypes";

export { PermissionGroupList } from "./RolePermissionSelectorList";

export function PermissionSelectorUnavailableState() {
  return (
    <div className="flex items-center justify-center p-8 text-center">
      <div className="text-muted-foreground">
        <p>Permission data is not available.</p>
        <p className="text-sm">Please refresh the page or contact support.</p>
      </div>
    </div>
  );
}

export function PermissionSelectorHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <CardHeader className="pb-3 flex-shrink-0">
      <CardTitle className="flex items-center space-x-2 text-lg">
        <div className="w-3 h-3 bg-primary rounded-full" />
        <span>{title}</span>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}

export function PermissionSelectorToolbar({
  actions,
  disabled,
  isLoading,
  selectedCount,
}: {
  actions: RolePermissionSelectorActions;
  disabled: boolean;
  isLoading: boolean;
  selectedCount: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={actions.selectAllPermissions}
          disabled={disabled}
          className="h-7 px-2 text-xs"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={actions.clearAllPermissions}
          disabled={disabled}
          className="h-7 px-2 text-xs"
        >
          Clear All
        </Button>
        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>
      <Badge variant="secondary" className="text-xs">
        {selectedCount} selected
      </Badge>
    </div>
  );
}

export function PermissionSearchInput({
  disabled,
  searchQuery,
  setSearchQuery,
}: {
  disabled: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  return (
    <div className="p-4 border-b flex-shrink-0">
      <div className="relative">
        <Input
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pr-8"
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
