import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function DetailsFieldRow({
  children,
  label,
  fieldId,
  isLast = false,
}: {
  children: ReactNode;
  label: string;
  fieldId: string;
  isLast?: boolean;
}) {
  return (
    <div className={cn(
      'grid min-h-11 items-start gap-2 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:items-center py-3',
      !isLast && 'border-b border-border/30',
    )}>
      <Label htmlFor={fieldId} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
