"use client";

import type { DragEvent } from "react";
import { PlusIcon as Plus } from "@heroicons/react/24/outline";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Applicant, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ApplicantKanbanCardStack } from "./ApplicantKanbanCardStack";

export type ApplicantClassicKanbanColumnProps = {
  label: string;
  value: string;
  applicants: Applicant[];
  effectiveColumnField: string | null;
  avatarFallback: string;
  avatarClassName: string;
  headerClassName: string;
  visibleFields: string[];
  recruiters?: UserProfile[];
  draggedApplicantId?: string;
  dragOverRow: string | null;
  dragOverColumn: string | null;
  onCardClick: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (rowValue: string, colValue: string, event: DragEvent) => void;
  onDragLeave: (rowValue: string, colValue: string, event: DragEvent) => void;
  onDrop: (rowValue: string, colValue: string) => void;
};

export function ApplicantClassicKanbanColumn({
  label,
  value,
  applicants,
  effectiveColumnField,
  avatarFallback,
  avatarClassName,
  headerClassName,
  visibleFields,
  recruiters,
  draggedApplicantId,
  dragOverRow,
  dragOverColumn,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: ApplicantClassicKanbanColumnProps) {
  const isActiveDropTarget = dragOverColumn === value && dragOverRow === "none";

  return (
    <div className="flex flex-col h-full" style={{ flex: "1 1 0%" }}>
      <Card
        className={cn(
          "flex flex-col h-full shadow-sm border border-border bg-card transition-all duration-200",
          isActiveDropTarget && "ring-2 ring-primary ring-opacity-50 bg-primary/5"
        )}
      >
        <CardHeader className={headerClassName}>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={avatarClassName}>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">{label}</CardTitle>
              <p className="text-xs text-muted-foreground">{effectiveColumnField}</p>
            </div>
          </div>
        </CardHeader>
        <div
          className={cn(
            "flex-1 min-h-0 p-4 space-y-4 transition-all duration-200 relative",
            isActiveDropTarget && "bg-primary/5"
          )}
          onDragOver={(event) => onDragOver("none", value, event)}
          onDragLeave={(event) => onDragLeave("none", value, event)}
          onDrop={() => onDrop("none", value)}
        >
          {isActiveDropTarget && <DropZoneIndicator targetLabel={label} />}

          <div className="space-y-2">
            {applicants.length > 0 ? (
              <ApplicantKanbanCardStack
                applicants={applicants}
                draggedApplicantId={draggedApplicantId}
                itemClassName="transition-all duration-200"
                onCardClick={onCardClick}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                visibleFields={visibleFields}
                recruiters={recruiters}
              />
            ) : (
              <EmptyDropZone isActive={isActiveDropTarget} />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function DropZoneIndicator({ targetLabel }: { targetLabel: string }) {
  return (
    <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg pointer-events-none z-10 flex items-center justify-center">
      <div className="text-center">
        <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
        <p className="text-sm font-medium text-primary">Drop here</p>
        <p className="text-xs text-primary/70">Move to {targetLabel}</p>
      </div>
    </div>
  );
}

function EmptyDropZone({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-16 border-2 border-dashed rounded-lg transition-all duration-200",
        isActive ? "border-primary bg-primary/5" : "border-muted"
      )}
    >
      <div className="text-center">
        <Plus
          className={cn(
            "w-4 h-4 mx-auto mb-1 transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p
          className={cn(
            "text-xs transition-colors duration-200",
            isActive ? "text-primary font-medium" : "text-muted-foreground"
          )}
        >
          Drop here
        </p>
      </div>
    </div>
  );
}
