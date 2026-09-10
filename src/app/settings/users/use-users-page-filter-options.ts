"use client";

import { useEffect, useState } from 'react';

import type { UserTeam } from '@/lib/types';
import { fetchUsersPageFilterOptions } from './users-page-api';

export function useUsersPageFilterOptions(sessionStatus: string) {
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [teams, setTeams] = useState<UserTeam[]>([]);

  useEffect(() => {
    const loadFilters = async () => {
      if (sessionStatus !== 'authenticated') return;

      try {
        const options = await fetchUsersPageFilterOptions();
        setTeams(options.teams);
        setRoles(options.roles);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    void loadFilters();
  }, [sessionStatus]);

  return { roles, teams };
}
