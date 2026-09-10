"use client";

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { signIn } from 'next-auth/react';

import type { UserProfile } from '@/lib/types';
import { fetchUsersPageList } from './users-page-api';
import {
  getUsersPageErrorMessage,
  type UsersPageFilters,
} from './users-page-utils';

interface UseUsersPageListLoaderOptions {
  currentPage: number;
  currentPath: string;
  pageSize: number;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  setFetchError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setUsers: Dispatch<SetStateAction<UserProfile[]>>;
}

export function useUsersPageListLoader({
  currentPage,
  currentPath,
  pageSize,
  sessionStatus,
  setFetchError,
  setIsLoading,
  setUsers,
}: UseUsersPageListLoaderOptions) {
  return useCallback(async (
    currentFilters: UsersPageFilters = {},
    currentPageParam?: number,
    currentPageSize?: number,
  ) => {
    if (sessionStatus !== 'authenticated') return;

    setIsLoading(true);
    setFetchError(null);

    const pageToUse = currentPageParam ?? currentPage;
    const pageSizeToUse = currentPageSize ?? pageSize;

    try {
      const { response, data, errorMessage } = await fetchUsersPageList(currentFilters, {
        page: pageToUse,
        pageSize: pageSizeToUse,
      });

      if (errorMessage) {
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: currentPath });
          return;
        }

        setFetchError(errorMessage);
        setUsers([]);
        return;
      }

      setUsers(data.users);
    } catch (error) {
      setFetchError(getUsersPageErrorMessage(error));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    currentPath,
    pageSize,
    sessionStatus,
    setFetchError,
    setIsLoading,
    setUsers,
  ]);
}
