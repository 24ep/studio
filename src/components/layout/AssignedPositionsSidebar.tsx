"use client";

import dynamic from "next/dynamic";

import {
  AssignedPositionsEmptyState,
  AssignedPositionsErrorState,
  AssignedPositionsList,
  AssignedPositionsLoadingState,
} from "./AssignedPositionsSidebarParts";
import type { AssignedPositionsSidebarProps } from "./AssignedPositionsSidebarTypes";
import { useAssignedPositionsSidebar } from "./use-assigned-positions-sidebar";

const PositionDetailDrawer = dynamic(
  () => import("@/components/positions/PositionDetailDrawer").then((module) => module.PositionDetailDrawer),
  { ssr: false },
);

export function AssignedPositionsSidebar({
  className,
  variant = "default",
}: AssignedPositionsSidebarProps) {
  const sidebar = useAssignedPositionsSidebar();

  if (!sidebar.user) {
    return null;
  }

  if (sidebar.isLoading) {
    return <AssignedPositionsLoadingState className={className} />;
  }

  if (sidebar.error) {
    return (
      <AssignedPositionsErrorState
        error={sidebar.error}
        className={className}
        onRetry={() => sidebar.fetchAssignedPositions(true)}
      />
    );
  }

  if (sidebar.positions.length === 0) {
    return <AssignedPositionsEmptyState variant={variant} className={className} />;
  }

  return (
    <>
      <AssignedPositionsList
        positions={sidebar.positions}
        variant={variant}
        className={className}
        onPositionClick={sidebar.openPosition}
      />
      {sidebar.selectedPositionId ? (
        <PositionDetailDrawer
          isOpen={sidebar.isPositionDrawerOpen}
          onOpenChange={sidebar.setIsPositionDrawerOpen}
          positionId={sidebar.selectedPositionId}
        />
      ) : null}
    </>
  );
}
