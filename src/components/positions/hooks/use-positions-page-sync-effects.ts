import { useEffect } from 'react';

import {
  getPositionPaginationUpdateFromSearch,
  getPositionSearchSyncUpdate,
} from '../position-page-utils';
import type { UsePositionsPageEffectsInput } from './use-positions-page-effects-types';

type SyncEffectsInput = Pick<
  UsePositionsPageEffectsInput,
  | 'hasInitialLoadRef'
  | 'isUpdatingURLRef'
  | 'page'
  | 'pageSize'
  | 'searchParams'
  | 'searchTerm'
  | 'setPage'
  | 'setPageSize'
  | 'setSearchTerm'
  | 'setStatusFilter'
  | 'statusFilter'
>;

export function usePositionsPageSyncEffects({
  hasInitialLoadRef,
  isUpdatingURLRef,
  page,
  pageSize,
  searchParams,
  searchTerm,
  setPage,
  setPageSize,
  setSearchTerm,
  setStatusFilter,
  statusFilter,
}: SyncEffectsInput) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncUpdate = getPositionSearchSyncUpdate(window.location.search, statusFilter, searchTerm);
    if (syncUpdate.statusFilter) {
      setStatusFilter(syncUpdate.statusFilter);
    }
    if (syncUpdate.searchTerm) {
      setSearchTerm(syncUpdate.searchTerm);
    }
  }, [searchParams, statusFilter, searchTerm, setStatusFilter, setSearchTerm]);

  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const query = (event as CustomEvent<string>).detail;
      if (query !== undefined && query !== searchTerm) {
        setSearchTerm(query);
      }
    };

    window.addEventListener('global:search', handleGlobalSearch);
    return () => window.removeEventListener('global:search', handleGlobalSearch);
  }, [searchTerm, setSearchTerm]);

  useEffect(() => {
    if (!hasInitialLoadRef.current || isUpdatingURLRef.current) {
      return;
    }

    const {
      page: nextPage,
      pageSize: nextPageSize,
      shouldUpdatePage,
      shouldUpdatePageSize,
    } = getPositionPaginationUpdateFromSearch(window.location.search, page, pageSize);

    if (shouldUpdatePage || shouldUpdatePageSize) {
      isUpdatingURLRef.current = true;

      if (shouldUpdatePage) {
        setPage(nextPage);
      }
      if (shouldUpdatePageSize) {
        setPageSize(nextPageSize);
      }

      setTimeout(() => {
        isUpdatingURLRef.current = false;
      }, 200);
    }
  }, [hasInitialLoadRef, isUpdatingURLRef, page, pageSize, searchParams, setPage, setPageSize]);
}
