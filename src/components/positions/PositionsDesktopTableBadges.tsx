import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { PositionHeadcount } from './PositionsDesktopTableTypes';

export function PositionHeadcountBadge({
  headcount,
  isLoading,
}: {
  headcount?: PositionHeadcount;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!headcount) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center justify-center">
      <Badge
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
          headcount.filled === 0 && headcount.total === 0
            ? 'border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            : headcount.filled >= headcount.total
              ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
              : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
        )}
      >
        {headcount.filled}/{headcount.total}
      </Badge>
    </div>
  );
}

export function ApplicantStatBadge({
  count,
  activeClassName,
}: {
  count: number;
  activeClassName: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-sm font-semibold tabular-nums',
        count > 0 ? activeClassName : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
      )}
    >
      {count}
    </span>
  );
}
