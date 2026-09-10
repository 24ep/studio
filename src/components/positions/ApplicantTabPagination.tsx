"use client";

import { Pagination } from '@/components/ui/pagination';

interface ApplicantTabPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  total: number;
}

export function ApplicantTabPagination({
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSize,
  total,
}: ApplicantTabPaginationProps) {
  if (total <= 0) return null;

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={Math.max(1, Math.ceil(total / pageSize))}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
