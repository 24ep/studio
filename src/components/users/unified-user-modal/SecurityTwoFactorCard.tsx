import { AlertCircle, ShieldCheck } from 'lucide-react';

import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile } from '@/lib/types';

interface SecurityTwoFactorCardProps {
  user?: UserProfile | null;
  show2FASetup: boolean;
  setShow2FASetup: (show: boolean) => void;
  isLoading: boolean;
  handleDisable2FA: () => Promise<void>;
}

export function SecurityTwoFactorCard({
  user,
  show2FASetup,
  setShow2FASetup,
  isLoading,
  handleDisable2FA,
}: SecurityTwoFactorCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user?.twoFactorEnabled ? (
          <EnabledTwoFactorState
            user={user}
            isLoading={isLoading}
            handleDisable2FA={handleDisable2FA}
          />
        ) : (
          <DisabledTwoFactorState onSetup={() => setShow2FASetup(true)} />
        )}

        {show2FASetup && (
          <TwoFactorSetup
            onComplete={() => {
              setShow2FASetup(false);
              window.location.reload();
            }}
            onCancel={() => setShow2FASetup(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EnabledTwoFactorState({
  user,
  isLoading,
  handleDisable2FA,
}: {
  user: UserProfile;
  isLoading: boolean;
  handleDisable2FA: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-green-900 dark:text-green-300">2FA is Enabled</h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            Your account is protected with {user.twoFactorMethod === 'email' ? 'Email Verification' : 'Authenticator App'}.
          </p>
        </div>
      </div>
      <Button variant="destructive" size="sm" onClick={handleDisable2FA} disabled={isLoading}>
        Disable 2FA
      </Button>
    </div>
  );
}

function DisabledTwoFactorState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Configured</AlertTitle>
        <AlertDescription>
          Two-factor authentication is not currently enabled for this account.
        </AlertDescription>
      </Alert>
      <Button type="button" onClick={onSetup}>
        Set Up 2FA
      </Button>
    </div>
  );
}
