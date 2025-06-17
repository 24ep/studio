// Pagination component for table navigation
import * as React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };
  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div>
        <button onClick={handlePrev} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="mx-2">Page {page} of {totalPages}</span>
        <button onClick={handleNext} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
      {onPageSizeChange && (
        <div>
          <label className="mr-2">Rows per page:</label>
          <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="border rounded px-2 py-1">
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}; 