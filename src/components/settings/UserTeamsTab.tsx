"use client";

import { Loader2, PlusCircle, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AddTeamMemberDialog,
  TeamsListSection,
  UserTeamDrawer,
} from './UserTeamsParts';
import {
  DeleteUserTeamDialog,
  UserTeamFormDialog,
} from './UserTeamsTabDialogs';
import { useUserTeamsTab } from './use-user-teams-tab';

interface UserTeamsTabProps {
  hideTitle?: boolean;
  title?: string;
  description?: string;
  createButtonLabel?: string;
}

export function UserTeamsTab({
  hideTitle = false,
  title = 'User Teams',
  description = 'Manage teams and team assignments',
  createButtonLabel = 'Create Team',
}: UserTeamsTabProps) {
  const controller = useUserTeamsTab();

  if (controller.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (controller.fetchError && !controller.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Teams</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{controller.fetchError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {!hideTitle && (
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          )}
          <p className="text-muted-foreground">{description}</p>
        </div>
        {controller.canCreateTeam && (
          <Button onClick={() => controller.handleOpenModal()} className="btn-hover-primary-gradient">
            <PlusCircle className="mr-2 h-4 w-4" />
            {createButtonLabel}
          </Button>
        )}
      </div>

      <TeamsListSection
        teams={controller.teams}
        searchTerm={controller.teamSearchTerm}
        page={controller.teamPage}
        teamsPerPage={controller.teamsPerPage}
        canCreateTeam={controller.canCreateTeam}
        onSearchTermChange={controller.setTeamSearchTerm}
        onPageChange={controller.setTeamPage}
        onCreateTeam={() => controller.handleOpenModal()}
        onSelectTeam={controller.handleSelectTeam}
      />

      {controller.selectedTeam && (
        <UserTeamDrawer
          team={controller.selectedTeam}
          open={controller.isTeamDrawerOpen}
          activeTab={controller.activeTab}
          members={controller.members}
          isLoadingMembers={controller.isLoadingMembers}
          isRemovingUser={controller.isRemovingUser}
          form={controller.form}
          onOpenChange={controller.setIsTeamDrawerOpen}
          onActiveTabChange={controller.setActiveTab}
          onSubmit={controller.handleTeamFormSubmit}
          onDeleteTeam={() => controller.setTeamToDelete(controller.selectedTeam)}
          onAddMember={() => controller.setIsAddUserModalOpen(true)}
          onRemoveMember={controller.handleRemoveUserFromTeam}
        />
      )}

      <UserTeamFormDialog
        open={controller.isModalOpen}
        editingTeam={controller.editingTeam}
        form={controller.form}
        onOpenChange={controller.setIsModalOpen}
        onSubmit={controller.handleTeamFormSubmit}
      />

      <AddTeamMemberDialog
        open={controller.isAddUserModalOpen}
        teamName={controller.selectedTeam?.name}
        searchTerm={controller.searchTerm}
        availableUsers={controller.availableUsers}
        selectedUserId={controller.selectedUserId}
        isLoadingAvailable={controller.isLoadingAvailable}
        isAddingUser={controller.isAddingUser}
        onOpenChange={controller.setIsAddUserModalOpen}
        onSearchTermChange={controller.setSearchTerm}
        onSearchUsers={controller.loadAvailableUsers}
        onSelectUser={controller.setSelectedUserId}
        onAddUser={controller.handleAddUserToTeam}
      />

      <DeleteUserTeamDialog
        teamToDelete={controller.teamToDelete}
        onOpenChange={(open) => {
          if (!open) controller.setTeamToDelete(null);
        }}
        onDelete={controller.handleDeleteTeam}
      />
    </div>
  );
}
