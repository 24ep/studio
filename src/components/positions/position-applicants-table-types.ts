export interface PositionApplicantVisibleColumns {
  name?: boolean;
  fitScore?: boolean;
  expectedSalary?: boolean;
  status?: boolean;
  applicationDate?: boolean;
  actions?: boolean;
}

export interface PositionApplicantsSortState {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  openMenu: string | null;
  onSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onOpenMenuChange: (menu: string | null) => void;
}
