"use client";

import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import type { TwoFactorSetupMethod } from './two-factor-setup-utils';

export function TwoFactorMethodOption({
  description,
  icon,
  id,
  title,
}: {
  description: string;
  icon: ReactNode;
  id: TwoFactorSetupMethod;
  title: string;
}) {
  return (
    <div className="flex items-center space-x-4 rounded-md border p-4">
      <RadioGroupItem value={id} id={id} />
      <Label htmlFor={id} className="flex flex-1 items-center cursor-pointer">
        {icon}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </Label>
    </div>
  );
}

export function TwoFactorSetupError({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
