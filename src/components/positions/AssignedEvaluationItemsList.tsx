"use client";

import type { MouseEvent } from "react";
import { Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AssignmentGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface AssignmentItem {
  id: string;
  name: string;
  groupId?: string;
}

interface AssignedEvaluationItemsListProps<TAssignment, TGroup extends AssignmentGroup> {
  groups: TGroup[];
  assignments: TAssignment[];
  getItem: (assignment: TAssignment) => AssignmentItem;
  isMobile: boolean;
  itemSingular: string;
  itemPlural: string;
  ungroupedTitle: string;
  removingAssignmentId: string | null;
  onRemove: (assignment: TAssignment, event: MouseEvent) => void;
  getAssignmentId: (assignment: TAssignment) => string;
  isRequired: (assignment: TAssignment) => boolean;
}

export function AssignedEvaluationItemsList<TAssignment, TGroup extends AssignmentGroup>({
  groups,
  assignments,
  getItem,
  isMobile,
  itemSingular,
  itemPlural,
  ungroupedTitle,
  removingAssignmentId,
  onRemove,
  getAssignmentId,
  isRequired,
}: AssignedEvaluationItemsListProps<TAssignment, TGroup>) {
  const renderAssignmentRow = (assignment: TAssignment) => {
    const item = getItem(assignment);
    const assignmentId = getAssignmentId(assignment);

    return (
      <div key={assignmentId} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
        <div className="flex items-center space-x-3">
          <h4 className="text-sm font-medium">{item.name}</h4>
          {isRequired(assignment) && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Required
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => onRemove(assignment, event)}
          disabled={removingAssignmentId === assignmentId}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          {removingAssignmentId === assignmentId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  };

  const renderGroupCard = (
    id: string,
    title: string,
    color: string | undefined,
    groupAssignments: TAssignment[],
    description?: string,
  ) => (
    <Card key={id}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color || "#9ca3af" }} />
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {groupAssignments.length}{" "}
            {groupAssignments.length === 1 ? itemSingular.toLowerCase() : itemPlural.toLowerCase()}
          </Badge>
        </div>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">{groupAssignments.map(renderAssignmentRow)}</div>
      </CardContent>
    </Card>
  );

  const groupedCards = groups
    .map((group) => {
      const groupAssignments = assignments.filter((assignment) => getItem(assignment).groupId === group.id);
      if (groupAssignments.length === 0) return null;

      return renderGroupCard(group.id, group.name, group.color, groupAssignments, group.description);
    })
    .filter(Boolean);

  const ungroupedAssignments = assignments.filter((assignment) => !getItem(assignment).groupId);

  return (
    <div className={cn("space-y-4", isMobile && "pb-40")}>
      {groupedCards}
      {ungroupedAssignments.length > 0 &&
        renderGroupCard("ungrouped", ungroupedTitle, "#9ca3af", ungroupedAssignments)}
    </div>
  );
}
