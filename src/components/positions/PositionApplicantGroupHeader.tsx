import { Pin as PinIcon, Users } from 'lucide-react';

import { TableCell, TableRow } from '@/components/ui/table';

export function ApplicantGroupHeader({
  label,
  count,
  colSpan,
  pinned,
}: {
  label: string;
  count: number;
  colSpan: number;
  pinned?: boolean;
}) {
  return (
    <TableRow className={pinned ? 'bg-primary/15 dark:bg-primary/25 border-b-2 border-primary/30' : 'bg-muted/30 border-b border-muted'}>
      <TableCell colSpan={colSpan} className="py-2 px-3">
        <div className="flex items-center gap-2">
          {pinned ? (
            <PinIcon className="h-4 w-4 text-primary fill-current rotate-45" />
          ) : (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={pinned ? 'font-semibold text-primary' : 'font-medium'}>{label}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
