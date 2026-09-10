import type React from "react";

import type { Position } from "@/lib/types";

export interface PositionMultiSelectDropdownProps {
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showOpenStatus?: boolean;
  filterOpenOnly?: boolean;
  singleSelect?: boolean;
  showUnassignedOption?: boolean;
}

export interface PositionMultiSelectActions {
  clearSelection: () => void;
  refreshPositions: () => void;
  removePosition: (
    positionId: string,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  selectAll: () => void;
  setSearchTerm: (value: string) => void;
  togglePosition: (positionId: string) => void;
}

export interface PositionMultiSelectState {
  allFilteredSelected: boolean;
  error: boolean;
  filteredPositions: Position[];
  hasNotApplied: boolean;
  loading: boolean;
  open: boolean;
  searchTerm: string;
  selectedFilteredCount: number;
  selectedPositions: Position[];
  setOpen: (open: boolean) => void;
}
