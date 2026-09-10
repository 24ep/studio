import type { UseFormReturn } from 'react-hook-form';

import type { UserGroup } from '@/lib/types';

import type { UnifiedUserFormValues } from './types';

export interface UserManagementFormProps {
  form: UseFormReturn<UnifiedUserFormValues>;
  userGroups: UserGroup[];
  isLoadingGroups: boolean;
  canManageUsers: boolean;
  isEditingSelf: boolean;
  canManageTeams: boolean;
  userTeams: { id: string; name: string }[];
  canManageAuthentication: boolean;
  isLookingUpAD: boolean;
  handleLookupAzureAD: () => Promise<void>;
}
