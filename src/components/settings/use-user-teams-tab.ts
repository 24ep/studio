"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import type { UserTeam } from '@/lib/types';
import { hasAnyPermission } from '@/lib/permissions';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  deleteUserTeam,
  saveUserTeam,
} from './user-teams-api';
import { useUserTeamMembers } from './use-user-team-members';
import {
  buildTeamFormValues,
} from './user-teams-utils';
import {
  EMPTY_TEAM_FORM_VALUES,
  teamFormResolver,
  type TeamFormValues,
} from './UserTeamsParts';

export type UserTeamDrawerTab = 'details' | 'members';

export function useUserTeamsTab() {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<UserTeam | null>(null);
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<UserTeam | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<UserTeam | null>(null);
  const [activeTab, setActiveTab] = useState<UserTeamDrawerTab>('details');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamPage, setTeamPage] = useState(1);
  const teamsPerPage = 10;
  const canCreateTeam = hasAnyPermission(session?.user, ['USERS_CREATE']);

  const form = useForm<TeamFormValues>({
    resolver: teamFormResolver,
    defaultValues: buildTeamFormValues(),
  });

  const teamMembers = useUserTeamMembers({ selectedTeam });

  const fetchTeams = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/settings/user-teams');
      if (!response.ok) {
        const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to fetch teams' });
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }

      setTeams(await readJsonOrFallback<UserTeam[]>(response, []));
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated' && session) {
      if (session.user.role !== 'Admin' && !hasAnyPermission(session.user, ['USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE'])) {
        setFetchError("You do not have permission to manage user teams.");
        setIsLoading(false);
      } else {
        fetchTeams();
      }
    }
  }, [fetchTeams, pathname, session, sessionStatus]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleSelectTeam = (team: UserTeam) => {
    setSelectedTeam(team);
    setIsTeamDrawerOpen(true);
    setActiveTab('details');
    teamMembers.loadTeamMembers(team.id);
    form.reset(buildTeamFormValues(team));
  };

  const handleOpenModal = (team: UserTeam | null = null) => {
    setEditingTeam(team);
    form.reset(team ? buildTeamFormValues(team) : EMPTY_TEAM_FORM_VALUES);
    setIsModalOpen(true);
  };

  const handleTeamFormSubmit = async (data: TeamFormValues) => {
    try {
      const { isEditing, result } = await saveUserTeam({ data, editingTeam, selectedTeam });

      toast.success(`Team "${result.name}" was successfully ${isEditing ? 'updated' : 'created'}.`);

      if (editingTeam) {
        setIsModalOpen(false);
      } else if (selectedTeam) {
        setIsTeamDrawerOpen(false);
        setSelectedTeam(null);
      }

      fetchTeams();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      await deleteUserTeam(teamToDelete);
      toast.success(`Team "${teamToDelete.name}" was successfully deleted.`);
      setTeamToDelete(null);
      fetchTeams();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return {
    activeTab,
    availableUsers: teamMembers.availableUsers,
    canCreateTeam,
    editingTeam,
    fetchError,
    form,
    isAddUserModalOpen: teamMembers.isAddUserModalOpen,
    isAddingUser: teamMembers.isAddingUser,
    isLoading,
    isLoadingAvailable: teamMembers.isLoadingAvailable,
    isLoadingMembers: teamMembers.isLoadingMembers,
    isModalOpen,
    isRemovingUser: teamMembers.isRemovingUser,
    isTeamDrawerOpen,
    members: teamMembers.members,
    searchTerm: teamMembers.searchTerm,
    selectedTeam,
    selectedUserId: teamMembers.selectedUserId,
    teamPage,
    teamSearchTerm,
    teams,
    teamsPerPage,
    teamToDelete,
    handleAddUserToTeam: teamMembers.handleAddUserToTeam,
    handleDeleteTeam,
    handleOpenModal,
    handleRemoveUserFromTeam: teamMembers.handleRemoveUserFromTeam,
    handleSelectTeam,
    handleTeamFormSubmit,
    loadAvailableUsers: teamMembers.loadAvailableUsers,
    setActiveTab,
    setIsAddUserModalOpen: teamMembers.setIsAddUserModalOpen,
    setIsModalOpen,
    setIsTeamDrawerOpen,
    setSearchTerm: teamMembers.setSearchTerm,
    setSelectedUserId: teamMembers.setSelectedUserId,
    setTeamPage,
    setTeamSearchTerm,
    setTeamToDelete,
  };
}
