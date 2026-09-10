import type { Session } from 'next-auth';

export interface AzureAdSyncResults {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ email: string; error: string }>;
}

export interface AzureAdUserSyncData {
  email: string;
  name: string;
  azureOid: string;
  department: string | null;
  jobTitle: string | null;
  officeLocation: string | null;
  employeeId: string | null;
  companyName: string | null;
  employeeType: string | null;
  hireDate: Date | null;
  manager: string | null;
  managerEmail: string | null;
  samAccountName: string | null;
  contactInfo: {
    streetAddress: string | null;
    city: string | null;
    stateOrProvince: string | null;
    postalCode: string | null;
    country: string | null;
    businessPhone: string | null;
    mobilePhone: string | null;
    otherEmails: string[];
  };
  accountEnabled: boolean;
  userTeamId?: string | null;
  avatarUrl?: string | null;
}

export interface AzureAdSyncStreamContext {
  session: Session & {
    user: Session['user'] & {
      id: string;
      email?: string | null;
    };
  };
  sendProgress: (message: string, isError?: boolean) => void;
  sendResult: (data: Record<string, unknown>) => void;
}
