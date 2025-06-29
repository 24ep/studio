// src/app/settings/users/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import { Loader2, ServerCrash, PlusCircle, ShieldAlert, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile } from '@/lib/types';
import UserTable from '@/components/settings/UserTable';
import UserFilters from '@/components/settings/UserFilters';
import AddUserModal from '@/components/settings/AddUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import UserAlertDialog from '@/components/settings/UserAlertDialog';

const userRoleOptionsFilter: (UserProfile['role'] | "ALL_ROLES")[] = ['ALL_ROLES', 'Admin', 'Recruiter', 'Hiring Manager'];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname(); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserProfile['role'] | "ALL_ROLES">("ALL_ROLES");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async (currentFilters: {name?: string, email?: string, role?: UserProfile['role'] | "ALL_ROLES"} = {}) => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    const queryParams = new URLSearchParams();
    if (currentFilters.name) queryParams.append('name', currentFilters.name);
    if (currentFilters.email) queryParams.append('email', currentFilters.email);
    if (currentFilters.role && currentFilters.role !== "ALL_ROLES") queryParams.append('role', currentFilters.role);
    try {
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401 || response.status === 403) {
             signIn(undefined, { callbackUrl: pathname });
             return;
        }
        setFetchError(errorData.message || 'Failed to fetch users');
        setUsers([]); 
        return;
      }
      const data: UserProfile[] = await response.json();
      setUsers(data);
    } catch (error) {
      const errorMessage = (error as Error).message || "An unexpected error occurred.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setUsers([]); 
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname]); 

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USERS_MANAGE')) {
        setFetchError("You do not have permission to manage users.");
        setIsLoading(false);
      } else {
        fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter});
      }
    }
  }, [sessionStatus, session, pathname, fetchUsers, nameFilter, emailFilter, roleFilter]); 

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleApplyFilters = () => {
    fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter});
  };
  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setRoleFilter("ALL_ROLES");
    fetchUsers({ role: "ALL_ROLES" });
  };
  const handleAddUser = async (data: any) => {
    // Implement add user logic
    setIsAddUserModalOpen(false);
    fetchUsers();
  };
  const handleEditUser = async (userId: string, data: any) => {
    // Implement edit user logic
    setIsEditUserModalOpen(false);
    setSelectedUserForEdit(null);
    fetchUsers();
  };
  const openEditModal = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditUserModalOpen(true);
  };
  const confirmDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
  };
  const handleDeleteUser = async () => {
    // Implement delete user logic
    setUserToDelete(null);
    fetchUsers();
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !pathname.startsWith('/auth/signin')) || (isLoading && !fetchError && users.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Users</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {fetchError === "You do not have permission to view this page." ? (
            <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
        ) : (
            <Button onClick={() => fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter})} className="btn-hover-primary-gradient">Try Again</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center text-2xl">
              <UsersRound className="mr-3 h-6 w-6 text-primary" /> Manage Users
            </CardTitle>
            <CardDescription className="mt-1">
               View, add, edit, and delete application users. Assign roles, permissions, and groups.
            </CardDescription>
          </div>
          {session?.user?.role === 'Admin' && (
              <Button className="w-full sm:w-auto btn-primary-gradient" onClick={() => setIsAddUserModalOpen(true)}> 
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
              </Button>
          )}
        </CardHeader>
        <CardContent>
          <UserFilters
            nameFilter={nameFilter}
            emailFilter={emailFilter}
            roleFilter={roleFilter}
            onNameChange={setNameFilter}
            onEmailChange={setEmailFilter}
            onRoleChange={setRoleFilter}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
          <UserTable
            users={users}
            onEdit={openEditModal}
            onDelete={confirmDeleteUser}
            isLoading={isLoading}
          />
          <div className="mt-6 p-3 bg-secondary/30 border border-secondary/50 rounded-md flex items-start text-sm text-secondary-foreground">
            <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-primary shrink-0" />
            <div>
              <span className="font-semibold">Security Note:</span> User creation, deletion, and modification of roles/permissions are restricted to &apos;Admin&apos; users. User passwords are securely hashed using bcrypt.
            </div>
          </div>
        </CardContent>
      </Card>
      <AddUserModal
        open={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUser}
      />
      <EditUserModal
        open={isEditUserModalOpen}
        user={selectedUserForEdit}
        onClose={() => setIsEditUserModalOpen(false)}
        onSubmit={handleEditUser}
      />
      <UserAlertDialog
        open={!!userToDelete}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
        user={userToDelete}
      />
    </div>
  );
}
    
