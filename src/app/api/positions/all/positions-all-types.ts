export interface PositionAllFilters {
  title?: string;
  department?: string;
  isOpen?: string;
  positionLevel?: string;
}

export interface PositionAllUserContext {
  userId: string;
  userName: string;
  userRole?: string;
  hasViewAllPermission: boolean;
}

export interface PositionAllQuery {
  query: string;
  params: unknown[];
}

export interface PositionAllRow {
  id: string;
  title: string;
  department: string;
  description?: string;
  isOpen: boolean;
  positionLevel?: string;
  customAttributes?: unknown;
  createdAt: string;
  updatedAt: string;
  gradeId?: string;
  [key: string]: unknown;
}

export interface PositionAllItem {
  id: string;
  title: string;
  department: string;
  description?: string;
  isOpen: boolean;
  positionLevel?: string;
  customAttributes?: unknown;
  createdAt: string;
  updatedAt: string;
  gradeId?: string;
  grade?: {
    id: string;
    name: string;
    label: string;
    color: string;
    slaDays: number;
    createdAt: string;
    updatedAt: string;
  };
}
