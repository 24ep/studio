import { useRef, useState } from 'react';
import { useDynamicHeight } from '@/hooks/use-dynamic-height';

export function useApplicantsPageLocalState() {
  const sidebarFilterRef = useRef<HTMLElement>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isClearingFilters, setIsClearingFilters] = useState(false);
  const [hasInitialDataFetch, setHasInitialDataFetch] = useState<boolean>(false);

  const { height: tableHeight, addFilterRef, removeFilterRef } = useDynamicHeight({
    minHeight: 300,
    maxHeight: 800,
    buffer: 20,
    debounceMs: 150,
  });

  return {
    sidebarFilterRef,
    batchTimeoutRef,
    page,
    setPage,
    total,
    setTotal,
    tableLoading,
    setTableLoading,
    tableError,
    setTableError,
    isClearingFilters,
    setIsClearingFilters,
    hasInitialDataFetch,
    setHasInitialDataFetch,
    tableHeight,
    addFilterRef,
    removeFilterRef,
  };
}
