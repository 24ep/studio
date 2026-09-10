"use client";

import { Button } from '@/components/ui/button';

interface EvaluationLinksPaginationProps {
  itemCount: number;
  total: number;
  offset: number;
  limit: number;
  onOffsetChange: (offset: number) => void;
}

export function EvaluationLinksPagination({
  itemCount,
  total,
  offset,
  limit,
  onOffsetChange,
}: EvaluationLinksPaginationProps) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div>
        Showing {itemCount} of {total}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          disabled={offset + limit >= total}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
