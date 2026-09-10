"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export function TwoFactorSuccessStep({
  backupCodes,
  onDone,
}: {
  backupCodes: string[];
  onDone?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <CardTitle>2FA Enabled</CardTitle>
        </div>
        <CardDescription>
          Two-factor authentication is now active on your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Backup Codes</AlertTitle>
          <AlertDescription>
            Save these backup codes in a secure place. You can use them to log in if you lose access to your device.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-md">
          {backupCodes.map((code, index) => (
            <code key={index} className="text-sm font-mono text-center select-all">{code}</code>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onDone}>Done</Button>
      </CardFooter>
    </Card>
  );
}
