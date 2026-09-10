import type { ContractExpiryState } from '@/lib/hr/contract-monitoring';

export type ContractView = 'table' | 'timeline' | 'workflow';

export interface ContractEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  jobTitle?: string | null;
  employmentType: string;
  clientName?: string | null;
  clientCode?: string | null;
  departmentName?: string | null;
  location?: string | null;
  managerName?: string | null;
  hireDate?: string | null;
  endDate?: string | null;
  contractNoticeDays?: number | null;
  employeeAvatarUrl?: string | null;
  status?: string | null;
  documentCount?: number;
  completedDocumentCount?: number;
  signedContractComplete?: boolean;
}

export interface ContractEmployeeWithExpiry extends ContractEmployee {
  expiry: {
    state: ContractExpiryState;
    daysRemaining: number | null;
    noticeDays: number | null;
  };
  documentProgress: number;
  documentCount: number;
  completedDocumentCount: number;
  signedContractComplete: boolean;
  owner: string;
}

export interface ContractDocument {
  id: string;
  employeeId?: string | null;
  type?: string | null;
  category?: string | null;
  status?: string | null;
}

export interface ContractFilters {
  query: string;
  employmentType: string;
  client: string;
  location: string;
  state: string;
}
