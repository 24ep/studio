import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PositionsPaginationControlsProps {
  isMobile: boolean;
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PositionsPaginationControls({
  isMobile,
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PositionsPaginationControlsProps) {
  if (total <= 0 && totalPages <= 0) return null;

  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, total);

  return (
    <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      {isMobile ? (
        <div className="flex flex-col items-center gap-2">
          {page < totalPages ? (
            <>
              <div className="text-sm text-muted-foreground text-center">
                Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} positions
              </div>
              <Button
                onClick={() => onPageChange(page + 1)}
                variant="outline"
                className="w-full max-w-xs h-12 text-base font-medium active:scale-95 touch-manipulation"
              >
                See More
                <ChevronDown className="h-5 w-5 ml-2" />
              </Button>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              Showing all {total} positions
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {firstVisible}-{lastVisible} of {total}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="mr-2 flex items-center gap-2">
              <span className="hidden lg:inline">Rows per page</span>
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="h-9 rounded-[8px] border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                aria-label="Rows per page"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-20 text-center font-semibold text-slate-700 dark:text-zinc-200">
              Page {page} / {Math.max(1, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
