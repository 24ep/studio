import type { UseFormReturn } from 'react-hook-form';

import type { UserProfile } from '@/lib/types';
import { SecurityPasswordCard } from './SecurityPasswordCard';
import { SecurityTwoFactorCard } from './SecurityTwoFactorCard';
import type { UnifiedUserFormValues } from './types';

interface SecurityTabProps {
  form: UseFormReturn<UnifiedUserFormValues>;
  user?: UserProfile | null;
  canForcePasswordChange: boolean;
  show2FASetup: boolean;
  setShow2FASetup: (show: boolean) => void;
  isLoading: boolean;
  handleDisable2FA: () => Promise<void>;
}

export function SecurityTab({
  form,
  user,
  canForcePasswordChange,
  show2FASetup,
  setShow2FASetup,
  isLoading,
  handleDisable2FA,
}: SecurityTabProps) {
  return (
    <div className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:outline-none">
      <SecurityTwoFactorCard
        user={user}
        show2FASetup={show2FASetup}
        setShow2FASetup={setShow2FASetup}
        isLoading={isLoading}
        handleDisable2FA={handleDisable2FA}
      />
      <SecurityPasswordCard
        form={form}
        canForcePasswordChange={canForcePasswordChange}
      />
    </div>
  );
}
