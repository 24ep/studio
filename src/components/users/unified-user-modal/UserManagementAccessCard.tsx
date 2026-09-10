import React from 'react';
import { Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { TeamSelector } from './TeamSelector';
import type { UserManagementFormProps } from './user-management-form-types';

type RoleAndGroupsCardProps = Pick<
  UserManagementFormProps,
  'form' | 'userGroups' | 'isLoadingGroups' | 'canManageUsers' | 'isEditingSelf' | 'canManageTeams' | 'userTeams'
>;

export function RoleAndGroupsCard({
  form,
  userGroups,
  isLoadingGroups,
  canManageUsers,
  isEditingSelf,
  canManageTeams,
  userTeams,
}: RoleAndGroupsCardProps): React.ReactElement {
  const selectedTeamIds = form.watch('userTeamIds') ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" />
          Role & Groups
        </CardTitle>
        <CardDescription>Manage user access levels and group assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SystemRoleField form={form} canManageUsers={canManageUsers} isEditingSelf={isEditingSelf} />
        <UserGroupField
          form={form}
          userGroups={userGroups}
          isLoadingGroups={isLoadingGroups}
          canManageUsers={canManageUsers}
        />
        <Separator />
        <TeamAssignmentsField
          form={form}
          userTeams={userTeams}
          selectedTeamIds={selectedTeamIds}
          canManageTeams={canManageTeams}
        />
      </CardContent>
    </Card>
  );
}

function SystemRoleField({
  form,
  canManageUsers,
  isEditingSelf,
}: Pick<UserManagementFormProps, 'form' | 'canManageUsers' | 'isEditingSelf'>): React.ReactElement {
  return (
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>System Role</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={!canManageUsers || isEditingSelf}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Recruiter">Recruiter</SelectItem>
              <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
              <SelectItem value="Employee">Employee</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
          {isEditingSelf && (
            <p className="text-xs text-muted-foreground mt-1">You cannot change your own role.</p>
          )}
        </FormItem>
      )}
    />
  );
}

function UserGroupField({
  form,
  userGroups,
  isLoadingGroups,
  canManageUsers,
}: Pick<
  UserManagementFormProps,
  'form' | 'userGroups' | 'isLoadingGroups' | 'canManageUsers'
>): React.ReactElement {
  return (
    <FormField
      control={form.control}
      name="userGroupIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>User Group</FormLabel>
          <Select
            onValueChange={(value) => field.onChange([value])}
            value={field.value?.[0] ?? ''}
            disabled={!canManageUsers || isLoadingGroups}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingGroups ? 'Loading groups...' : 'Select User Group'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {userGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TeamAssignmentsField({
  form,
  userTeams,
  selectedTeamIds,
  canManageTeams,
}: Pick<UserManagementFormProps, 'form' | 'userTeams' | 'canManageTeams'> & {
  selectedTeamIds: string[];
}): React.ReactElement {
  return (
    <div className="space-y-3">
      <Label>Team Assignments</Label>
      {canManageTeams ? (
        <TeamSelector
          teams={userTeams}
          selectedIds={selectedTeamIds}
          onSelect={(ids) => form.setValue('userTeamIds', ids, { shouldDirty: true })}
        />
      ) : (
        <ReadOnlyTeamAssignments userTeams={userTeams} selectedTeamIds={selectedTeamIds} />
      )}
    </div>
  );
}

function ReadOnlyTeamAssignments({
  userTeams,
  selectedTeamIds,
}: {
  userTeams: { id: string; name: string }[];
  selectedTeamIds: string[];
}): React.ReactElement {
  const selectedTeams = userTeams.filter((team) => selectedTeamIds.includes(team.id));

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTeams.map((team) => (
        <Badge key={team.id} variant="secondary">
          {team.name}
        </Badge>
      ))}
      {selectedTeamIds.length === 0 && (
        <span className="text-sm text-muted-foreground italic">No teams assigned</span>
      )}
    </div>
  );
}
