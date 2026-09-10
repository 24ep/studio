"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApplicationLogsPaginationProps {
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((previous: number) => number)) => void;
}

export function ApplicationLogsPagination({
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: ApplicationLogsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1 || isLoading}>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || isLoading}>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
