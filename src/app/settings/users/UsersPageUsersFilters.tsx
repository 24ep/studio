import { Filter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeUsersPageRoleFilter } from './users-page-utils';
import type { UsersPageUsersTabProps } from './UsersPageUsersTabTypes';

type UsersPageUsersFiltersProps = Pick<
  UsersPageUsersTabProps,
  | 'teams'
  | 'roles'
  | 'nameFilter'
  | 'emailFilter'
  | 'roleFilter'
  | 'teamFilter'
  | 'onNameFilterChange'
  | 'onEmailFilterChange'
  | 'onRoleFilterChange'
  | 'onTeamFilterChange'
  | 'onApplyFilters'
>;

export function UsersPageUsersFilters({
  teams,
  roles,
  nameFilter,
  emailFilter,
  roleFilter,
  teamFilter,
  onNameFilterChange,
  onEmailFilterChange,
  onRoleFilterChange,
  onTeamFilterChange,
  onApplyFilters,
}: UsersPageUsersFiltersProps) {
  const hasFilters = Boolean(nameFilter || emailFilter || roleFilter !== 'ALL_ROLES' || teamFilter !== 'ALL_TEAMS');

  const clearFilters = () => {
    onNameFilterChange('');
    onEmailFilterChange('');
    onRoleFilterChange('ALL_ROLES');
    onTeamFilterChange('ALL_TEAMS');
  };

  return (
    <div className="border-b border-border p-3">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => { event.preventDefault(); onApplyFilters(); }}
      >
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search user accounts"
            className="h-9 pl-9"
            placeholder="Search name or email"
            value={nameFilter || emailFilter}
            onChange={(event) => { onNameFilterChange(event.target.value); onEmailFilterChange(event.target.value); }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => onRoleFilterChange(normalizeUsersPageRoleFilter(value))}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by role"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_ROLES">All roles</SelectItem>
            {roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={onTeamFilterChange}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Filter by team"><SelectValue placeholder="All departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_TEAMS">All departments</SelectItem>
            {teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" variant="outline"><Filter className="mr-2 h-4 w-4" />Apply</Button>
        {hasFilters && <Button type="button" size="icon" variant="ghost" aria-label="Clear filters" onClick={clearFilters}><X className="h-4 w-4" /></Button>}
      </form>
    </div>
  );
}
