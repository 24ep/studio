"use client";

import type { DragEvent } from "react";
import type { Applicant, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ApplicantClassicKanbanColumn } from "./ApplicantClassicKanbanColumn";
import {
  filterApplicantsByKanbanFieldValue,
  filterUncategorizedKanbanApplicants,
  getClassicKanbanColumnsToShow,
} from "./applicant-kanban-layout-utils";

type ApplicantClassicKanbanColumnsProps = {
  applicants: Applicant[];
  columnField: string;
  effectiveColumnField: string | null;
  effectiveColumnValues: string[];
  visibleColumnValues: string[];
  visibleFields: string[];
  recruiters?: UserProfile[];
  draggedApplicantId?: string;
  dragOverRow: string | null;
  dragOverColumn: string | null;
  isImpersonating: boolean;
  onCardClick: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
  onDragOver: (rowValue: string, colValue: string, event: DragEvent) => void;
  onDragLeave: (rowValue: string, colValue: string, event: DragEvent) => void;
  onDrop: (rowValue: string, colValue: string) => void;
};

export function ApplicantClassicKanbanColumns({
  applicants,
  columnField,
  effectiveColumnField,
  effectiveColumnValues,
  visibleColumnValues,
  visibleFields,
  recruiters,
  draggedApplicantId,
  dragOverRow,
  dragOverColumn,
  isImpersonating,
  onCardClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: ApplicantClassicKanbanColumnsProps) {
  const columnsToShow = getClassicKanbanColumnsToShow(visibleColumnValues, effectiveColumnValues);
  const uncategorizedApplicants = filterUncategorizedKanbanApplicants(applicants, columnField, columnsToShow);
  const defaultHeaderClassName = cn(
    "p-4 border-b border-border sticky bg-card z-10 flex-shrink-0",
    isImpersonating ? "top-24" : "top-16"
  );

  return (
    <div className="w-full h-[calc(100%-200px)] min-h-[400px] bg-muted/30 rounded-lg p-4 flex gap-4">
      {columnsToShow.map((columnValue) => (
        <ApplicantClassicKanbanColumn
          key={columnValue}
          label={columnValue}
          value={columnValue}
          applicants={filterApplicantsByKanbanFieldValue(applicants, columnField, columnValue)}
          effectiveColumnField={effectiveColumnField}
          avatarFallback={columnValue?.charAt(0)?.toUpperCase() || "C"}
          avatarClassName="bg-primary/10 text-primary text-sm"
          headerClassName={defaultHeaderClassName}
          visibleFields={visibleFields}
          recruiters={recruiters}
          draggedApplicantId={draggedApplicantId}
          dragOverRow={dragOverRow}
          dragOverColumn={dragOverColumn}
          onCardClick={onCardClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}
      <ApplicantClassicKanbanColumn
        label="Uncategorized"
        value="uncategorized"
        applicants={uncategorizedApplicants}
        effectiveColumnField={effectiveColumnField}
        avatarFallback="?"
        avatarClassName="bg-muted text-muted-foreground text-sm"
        headerClassName="p-4 border-b border-border sticky top-16 bg-card z-10 flex-shrink-0"
        visibleFields={visibleFields}
        recruiters={recruiters}
        draggedApplicantId={draggedApplicantId}
        dragOverRow={dragOverRow}
        dragOverColumn={dragOverColumn}
        onCardClick={onCardClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />
    </div>
  );
}
