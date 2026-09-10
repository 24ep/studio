export interface AssignedPosition {
  id: string;
  title: string;
  department: string;
  positionLevel?: string;
  isOpen?: boolean;
  gradeSlaDays?: number | null;
  headcount: {
    total: number;
    vacant: number;
    filled: number;
  };
  grade?: {
    name: string;
    color: string;
  };
  createdAt?: string;
}

export interface AssignedPositionsSidebarProps {
  className?: string;
  variant?: "default" | "compact";
}

export interface AssignedPositionsResponse {
  data?: AssignedPosition[];
}
