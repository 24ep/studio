"use client";

import React from "react";

import { useSharedSSE } from "@/hooks/use-shared-sse";
import type { Position } from "@/lib/types";
import type {
  PositionMultiSelectActions,
  PositionMultiSelectDropdownProps,
  PositionMultiSelectState,
} from "./PositionMultiSelectDropdownTypes";
import { fetchApplicantPositionList } from "./position-list-api";

export function usePositionMultiSelectDropdown({
  disabled = false,
  filterOpenOnly = false,
  onSelectionChange,
  selectedIds,
  singleSelect = false,
}: Pick<
  PositionMultiSelectDropdownProps,
  | "disabled"
  | "filterOpenOnly"
  | "onSelectionChange"
  | "selectedIds"
  | "singleSelect"
>): PositionMultiSelectState & { actions: PositionMultiSelectActions } {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const { subscribeToEvents } = useSharedSSE();

  const fetchPositions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const fetchedPositions = await fetchApplicantPositionList();
      setPositions(
        filterOpenOnly
          ? fetchedPositions.filter((position: Position) => position.isOpen)
          : fetchedPositions,
      );
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filterOpenOnly]);

  React.useEffect(() => {
    void fetchPositions();
  }, [fetchPositions]);

  React.useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
      const action = (event as { action?: string })?.action;
      if (event.type === "position_update" && action === "list_updated") {
        void fetchPositions();
      }
    });

    return unsubscribe;
  }, [fetchPositions, subscribeToEvents]);

  const filteredPositions = React.useMemo(() => {
    const query = searchTerm.toLowerCase();
    return positions.filter(
      (position) =>
        position &&
        (position.title?.toLowerCase().includes(query) ||
          position.department?.toLowerCase().includes(query) ||
          position.positionLevel?.toLowerCase().includes(query)),
    );
  }, [positions, searchTerm]);

  const selectedPositions = React.useMemo(
    () =>
      positions.filter((position) => position && selectedIds.has(position.id)),
    [positions, selectedIds],
  );
  const allFilteredSelected =
    filteredPositions.length > 0 &&
    filteredPositions.every((position) => selectedIds.has(position.id));
  const selectedFilteredCount = filteredPositions.filter((position) =>
    selectedIds.has(position.id),
  ).length;

  const togglePosition = React.useCallback(
    (positionId: string) => {
      if (disabled) return;

      if (singleSelect) {
        onSelectionChange(
          selectedIds.has(positionId) ? new Set() : new Set([positionId]),
        );
        return;
      }

      const newSelected = new Set(selectedIds);
      if (newSelected.has(positionId)) {
        newSelected.delete(positionId);
      } else {
        newSelected.add(positionId);
      }
      onSelectionChange(newSelected);
    },
    [disabled, onSelectionChange, selectedIds, singleSelect],
  );

  const selectAll = React.useCallback(() => {
    if (disabled) return;

    const newSelected = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredPositions.forEach((position) => newSelected.delete(position.id));
    } else {
      filteredPositions.forEach((position) => newSelected.add(position.id));
    }
    onSelectionChange(newSelected);
  }, [
    allFilteredSelected,
    disabled,
    filteredPositions,
    onSelectionChange,
    selectedIds,
  ]);

  const removePosition = React.useCallback(
    (
      positionId: string,
      event?: React.MouseEvent | React.KeyboardEvent,
    ) => {
      event?.stopPropagation();
      if (disabled) return;

      const newSelected = new Set(selectedIds);
      newSelected.delete(positionId);
      onSelectionChange(newSelected);
    },
    [disabled, onSelectionChange, selectedIds],
  );

  return {
    actions: {
      clearSelection: () => {
        if (!disabled) {
          onSelectionChange(new Set());
        }
      },
      refreshPositions: () => {
        void fetchPositions();
      },
      removePosition,
      selectAll,
      setSearchTerm,
      togglePosition,
    },
    allFilteredSelected,
    error,
    filteredPositions,
    hasNotApplied: selectedIds.has("not-applied"),
    loading,
    open,
    searchTerm,
    selectedFilteredCount,
    selectedPositions,
    setOpen,
  };
}
