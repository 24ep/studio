import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100, 200, 500, 1000],
  showPageSizeSelector = true,
  className = "",
}: PaginationProps) {
  return (
    <div className={`flex items-center justify-between mt-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground -ml-1" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground -ml-1" />
        </Button>
      </div>
      {showPageSizeSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value);
              onPageSizeChange(newPageSize);
              onPageChange(1); // Reset to first page when changing page size
            }}
            className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground hover:bg-muted/50 transition-colors duration-200"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 