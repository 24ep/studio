import { Edit3, MoreHorizontal, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserAvatarCompact } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';
import { getUserAccountStatus, getUserRoleBadgeLabel } from './users-page-utils';
import type { UsersPageUsersTabProps } from './UsersPageUsersTabTypes';

type UsersPageUserRowProps = Pick<
  UsersPageUsersTabProps,
  'selectedUserIds' | 'onSelectUser' | 'onOpenUserModal' | 'onToggleUserStatus' | 'onConfirmDeleteUser'
> & {
  user: UserProfile;
  isInspected: boolean;
  onInspectUser: (user: UserProfile) => void;
};

export function UsersPageUserRow({
  user,
  selectedUserIds,
  onSelectUser,
  onOpenUserModal,
  onToggleUserStatus,
  onConfirmDeleteUser,
  isInspected,
  onInspectUser,
}: UsersPageUserRowProps) {
  const accountStatus = getUserAccountStatus(user);
  const statusPresentation = {
    active: { label: 'Active', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' },
    invited: { label: 'Invited', className: 'border-amber-500/30 bg-amber-500/10 text-amber-500' },
    disabled: { label: 'Suspended', className: 'border-red-500/30 bg-red-500/10 text-red-500' },
  }[accountStatus];

  const lastLogin = user.lastLogin
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(user.lastLogin))
    : 'Never';

  return (
    <TableRow
      data-state={isInspected ? 'selected' : undefined}
      className={cn('cursor-pointer text-xs', isInspected && 'bg-primary/10 hover:bg-primary/10')}
      onClick={() => onInspectUser(user)}
    >
      <TableCell className="w-10 px-3" onClick={(event) => event.stopPropagation()}>
        <Checkbox checked={selectedUserIds.has(user.id)} onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)} />
      </TableCell>
      <TableCell className="min-w-[210px] py-2.5">
        <div className="flex items-center gap-3">
          <UserAvatarCompact user={user} size="md" />
          <div className="min-w-0"><p className="truncate font-medium text-foreground">{user.name}</p><p className="truncate text-[11px] text-muted-foreground">{user.email}</p></div>
        </div>
      </TableCell>
      <TableCell className="min-w-[150px] py-2.5">
        <p className="truncate">{user.employeeId || '—'}</p>
        <p className="truncate text-[11px] text-muted-foreground">{user.department || user.teams?.[0]?.name || 'No department'}</p>
      </TableCell>
      <TableCell className="py-2.5"><Badge variant="outline" className="whitespace-nowrap font-normal">{getUserRoleBadgeLabel(user)}</Badge></TableCell>
      <TableCell className="py-2.5"><Badge variant="outline" className={cn('whitespace-nowrap font-normal', statusPresentation.className)}>{statusPresentation.label}</Badge></TableCell>
      <TableCell className="py-2.5">
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', user.twoFactorEnabled ? 'text-emerald-500' : 'text-muted-foreground')}>
          <ShieldCheck className="h-3.5 w-3.5" />{user.twoFactorEnabled ? 'MFA' : 'Password'}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap py-2.5 text-muted-foreground">{lastLogin}</TableCell>
      <TableCell className="py-2.5 text-right" onClick={(event) => event.stopPropagation()}>
        <UsersPageUserActions user={user} onOpenUserModal={onOpenUserModal} onToggleUserStatus={onToggleUserStatus} onConfirmDeleteUser={onConfirmDeleteUser} />
      </TableCell>
    </TableRow>
  );
}

function UsersPageUserActions({ user, onOpenUserModal, onToggleUserStatus, onConfirmDeleteUser }: Pick<UsersPageUserRowProps, 'user' | 'onOpenUserModal' | 'onToggleUserStatus' | 'onConfirmDeleteUser'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${user.name || user.email}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpenUserModal('edit', user)}><Edit3 className="mr-2 h-4 w-4" />Edit account</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleUserStatus(user)}><ShieldAlert className="mr-2 h-4 w-4" />Toggle status</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onConfirmDeleteUser(user)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete account</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
