"use client";

import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";

import type { UserTeam } from "@/lib/types";

import {
  addUserToTeam,
  fetchAvailableTeamUsers,
  fetchTeamMembers,
  removeUserFromTeam,
} from "./user-teams-api";
import type { AvailableUser, TeamMember } from "./UserTeamsParts";

type UseUserTeamMembersInput = {
  selectedTeam: UserTeam | null;
};

export function useUserTeamMembers({ selectedTeam }: UseUserTeamMembersInput) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemovingUser, setIsRemovingUser] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const loadTeamMembers = useCallback(async (teamId: string) => {
    setIsLoadingMembers(true);
    try {
      setMembers(await fetchTeamMembers(teamId));
    } catch (error) {
      console.error("Error loading team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  const loadAvailableUsers = useCallback(async () => {
    if (!selectedTeam) return;

    setIsLoadingAvailable(true);
    try {
      setAvailableUsers(await fetchAvailableTeamUsers({
        teamId: selectedTeam.id,
        searchTerm,
        origin: window.location.origin,
      }));
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [searchTerm, selectedTeam]);

  const handleAddUserToTeam = useCallback(async () => {
    if (!selectedUserId || !selectedTeam) return;

    setIsAddingUser(true);
    try {
      await addUserToTeam(selectedTeam.id, selectedUserId);
      toast.success("User added to team successfully");
      setSelectedUserId("");
      setIsAddUserModalOpen(false);
      loadTeamMembers(selectedTeam.id);
      loadAvailableUsers();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAddingUser(false);
    }
  }, [loadAvailableUsers, loadTeamMembers, selectedTeam, selectedUserId]);

  const handleRemoveUserFromTeam = useCallback(async (userId: string) => {
    if (!selectedTeam) return;

    setIsRemovingUser(userId);
    try {
      await removeUserFromTeam(selectedTeam.id, userId);
      toast.success("User removed from team successfully");
      loadTeamMembers(selectedTeam.id);
      loadAvailableUsers();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsRemovingUser(null);
    }
  }, [loadAvailableUsers, loadTeamMembers, selectedTeam]);

  return {
    availableUsers,
    handleAddUserToTeam,
    handleRemoveUserFromTeam,
    isAddUserModalOpen,
    isAddingUser,
    isLoadingAvailable,
    isLoadingMembers,
    isRemovingUser,
    loadAvailableUsers,
    loadTeamMembers,
    members,
    searchTerm,
    selectedUserId,
    setIsAddUserModalOpen,
    setSearchTerm,
    setSelectedUserId,
  };
}
