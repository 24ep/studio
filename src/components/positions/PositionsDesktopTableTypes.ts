import type { Position } from '@/lib/types';

import type { PositionRecruiterOption, PositionSortDirection } from './position-page-utils';

export type PositionHeadcount = {
  total: number;
  vacant: number;
  filled: number;
};

export interface PositionsDesktopTableProps {
  positions: Position[];
  isLoading: boolean;
  isTableLoading: boolean;
  isJobMatchEnabled: boolean;
  page: number;
  pageSize: number;
  selectedIds: string[];
  allSelected: boolean;
  sortColumn: string | null;
  sortDirection: PositionSortDirection;
  openMenu: string | null;
  isLoadingHeadcount: boolean;
  headcountData: Record<string, PositionHeadcount>;
  availableRecruiter: PositionRecruiterOption[];
  canAssignPositionRecruiter: boolean;
  assigningRecruiter: string | null;
  onSelectAll: (checked: boolean) => void;
  onRowSelect: (id: string, checked: boolean) => void;
  onOpenMenuChange: (menu: string | null) => void;
  onSort: (column: string | null, direction?: PositionSortDirection) => void;
  onViewPosition: (positionId: string) => void;
  onEditPosition: (positionId: string) => void;
  onDeletePosition: (position: Position) => void;
  onAssignRecruiter: (positionId: string, recruiterId: string | null) => Promise<void>;
  onResetAssigning: () => void;
}
