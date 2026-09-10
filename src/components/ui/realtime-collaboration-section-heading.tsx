import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';

export function RealtimeSectionHeading({
  icon,
  label,
  count,
}: {
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}
