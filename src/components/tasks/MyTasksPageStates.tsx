import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkeletonKanbanCard } from '@/components/ui/loading-overlay';
import type { MyTasksFilters } from '@/components/tasks/my-tasks-page-utils';
import { useLocalization } from '@/contexts/LocalizationContext';

interface MyTasksLoadingStateProps {
  message: string;
  embedded?: boolean;
  variant?: 'spinner' | 'board';
}

interface MyTasksEmptyStateProps {
  filters: MyTasksFilters;
  onClearFilters: () => void;
}

export function MyTasksLoadingState({
  embedded = false,
  message,
  variant = 'spinner',
}: MyTasksLoadingStateProps) {
  if (variant === 'board') {
    return <MyTasksBoardSkeleton embedded={embedded} message={message} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

function MyTasksBoardSkeleton({ embedded, message }: { embedded: boolean; message: string }) {
  return (
    <div
      className={embedded ? 'flex h-full min-h-0 flex-col bg-background' : 'flex h-screen min-h-0 flex-col bg-background'}
      aria-busy="true"
      aria-label={message}
    >
      <span className="sr-only">{message}</span>

      <div className={embedded ? 'flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 px-4 py-2' : 'shrink-0 space-y-4 border-b border-border bg-card px-6 py-4'}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {Array.from({ length: embedded ? 6 : 4 }).map((_, index) => (
              <div
                key={`toolbar-skeleton-${index}`}
                className={index === 1 && !embedded ? 'h-9 w-52 animate-pulse rounded-md bg-muted' : 'h-9 w-24 animate-pulse rounded-md bg-muted'}
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`score-skeleton-${index}`} className="h-8 w-20 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-muted/20 p-4">
        <div className="grid h-full min-w-[980px] grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, columnIndex) => (
            <section key={`column-skeleton-${columnIndex}`} className="min-w-0 rounded-lg border border-border bg-muted/15 p-3">
              <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-7 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: columnIndex % 2 === 0 ? 3 : 2 }).map((__, cardIndex) => (
                  <SkeletonKanbanCard key={`card-skeleton-${columnIndex}-${cardIndex}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MyTasksMobileUnavailableState() {
  const { t } = useLocalization();
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="mb-2 text-lg font-semibold">
        {t("tasks.mobileUnavailable.title", "My Tasks is not available on mobile yet")}
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("tasks.mobileUnavailable.description", "Please use the desktop version to manage your task board.")}
      </p>
    </div>
  );
}

export function MyTasksEmptyState({ filters, onClearFilters }: MyTasksEmptyStateProps) {
  const { t } = useLocalization();
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="w-16 h-16 flex items-center justify-center">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {t("tasks.emptyState.title", "No applicants found")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {hasFilters
              ? t("tasks.emptyState.filterHint", "Try adjusting your filters to see more results.")
              : t("tasks.emptyState.noAssignments", "No applicants are currently assigned to you.")
            }
          </p>
        </div>
        {hasFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="mt-2"
          >
            {t("tasks.filters.clearFilters", "Clear Filters")}
          </Button>
        )}
      </div>
    </div>
  );
}
