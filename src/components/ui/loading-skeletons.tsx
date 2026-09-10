"use client";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg border bg-card p-6 space-y-4 content-fade-in ${className || ''}`}>
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-muted rounded-md animate-pulse flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonKanbanCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 content-fade-in">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-muted rounded-full animate-pulse flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 bg-muted rounded w-16 animate-pulse" />
        <div className="h-5 bg-muted rounded w-20 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-muted rounded animate-pulse flex-1"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 bg-muted rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRows({ rows = 10, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="content-fade-in">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${columnIndex}`} className="p-4">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3 stagger-fade-in">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
