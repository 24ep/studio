"use client";

import { MagnifyingGlassIcon as Search } from "@heroicons/react/24/outline";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Position } from "@/lib/types";

interface PositionSectionProps {
  selectedPositionId: string;
  positionSearchTerm: string;
  filteredPositions: Position[];
  searchInputRef: Ref<HTMLInputElement>;
  onPositionChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSearchBlur: () => void;
}

export function ReprocessPositionSection({
  selectedPositionId,
  positionSearchTerm,
  filteredPositions,
  searchInputRef,
  onPositionChange,
  onSearchChange,
  onSearchBlur,
}: PositionSectionProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="position-select">Applied Position</Label>
      <Select value={selectedPositionId} onValueChange={onPositionChange} disabled={false}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select position to apply for..." />
        </SelectTrigger>
        <SelectContent selectId="reprocess-position-select">
          <div className="flex items-center px-3 pb-2 border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search positions..."
              value={positionSearchTerm}
              onChange={(event) => {
                event.stopPropagation();
                onSearchChange(event.target.value);
              }}
              onKeyDown={(event) => event.stopPropagation()}
              onFocus={(event) => event.stopPropagation()}
              onBlur={(event) => {
                event.stopPropagation();
                onSearchBlur();
              }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredPositions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                <div className="flex items-center gap-2">
                  <span>{position.title}</span>
                  {position.department && (
                    <Badge variant="outline" className="text-xs">
                      {position.department}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
