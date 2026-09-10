import React from 'react';

import { Label } from '@/components/ui/label';

export function SystemSettingsFieldRow({
  children,
  description,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  description?: string;
  htmlFor?: string;
  label: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6">
      <div className="space-y-1 md:col-span-4">
        {typeof label === 'string' ? (
          <Label htmlFor={htmlFor} className="text-sm font-medium leading-none">
            {label}
          </Label>
        ) : label}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0 md:col-span-8">
        {children}
      </div>
    </div>
  );
}
