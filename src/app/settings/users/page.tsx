
// src/app/settings/users/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from '@/components/ui/button'; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UsersRound, ShieldAlert, Edit3, Trash2, ServerCrash, Loader2, MoreHorizontal, KeyRound, Filter, Search, XCircle } from "lucide-react";
import type { UserProfile, UserGroup } from '@/lib/types'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect, useCallback } from 'react'; 
import { useToast } from "@/hooks/use-toast";
import { AddUserModal, type AddUserFormValues } from '@/components/users/AddUserModal';
import { EditUserModal, type EditUserFormValues } from '@/components/users/EditUserModal';
import { useRouter, usePathname } from 'next/navigation'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { signIn, useSession } from "next-auth/react";

const userRoleOptionsFilter: (UserProfile['role'] | "ALL_ROLES")[] = ['ALL_ROLES', 'Admin', 'Recruiter', 'Hiring Manager'];


export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
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
  }, [sessionStatus, pathname, signIn]); 

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, pathname, signIn, nameFilter, emailFilter, roleFilter]); 

  const handleApplyFilters = () => {
    fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter});
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setRoleFilter("ALL_ROLES");
    fetchUsers({ role: "ALL_ROLES" });
  };


  const handleAddUser = async (data: AddUserFormValues) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(result.message || 'Failed to add user');
      }
      fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter}); 
      toast({ title: "Success", description: `User ${result.name} added successfully.` });
      setIsAddUserModalOpen(false);
    } catch (error) {
      toast({ title: "Error Adding User", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleEditUser = async (userId: string, data: EditUserFormValues) => {
     try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
         if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(result.message || 'Failed to update user');
      }
      fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter}); 
      toast({ title: "Success", description: `User ${result.name} updated successfully.` });
      setIsEditUserModalOpen(false);
      setSelectedUserForEdit(null);
    } catch (error) {
      toast({ title: "Error Updating User", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const openEditModal = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditUserModalOpen(true);
  };

  const confirmDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Failed to delete user."}));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message || 'Failed to delete user');
      }
      fetchUsers({name: nameFilter, email: emailFilter, role: roleFilter}); 
      toast({ title: "Success", description: `User ${userToDelete.name} deleted.` });
    } catch (error) {
      toast({ title: "Error Deleting User", description: (error as Error).message, variant: "destructive" });
    } finally {
      setUserToDelete(null); 
    }
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
    <div className="space-y-6">
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
          {/* Filters Section */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="name-filter">Name</Label>
                <Input id="name-filter" placeholder="Filter by name..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} disabled={isLoading}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email-filter">Email</Label>
                <Input id="email-filter" placeholder="Filter by email..." value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} disabled={isLoading}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="role-filter">Role</Label>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserProfile['role'] | "ALL_ROLES")} disabled={isLoading}>
                  <SelectTrigger id="role-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {userRoleOptionsFilter.map(opt => <SelectItem key={opt} value={opt}>{opt === "ALL_ROLES" ? "All Roles" : opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} disabled={isLoading} className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4"/>Apply</Button>
                <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} className="w-full sm:w-auto"><XCircle className="mr-2 h-4 w-4"/>Reset</Button>
              </div>
            </div>
          </div>

          {isLoading && users.length === 0 && !fetchError ? (
              <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 && !fetchError ? ( 
            <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found matching your criteria.</p>
                {session?.user?.role === 'Admin' && (
                  <Button className="mt-4 btn-primary-gradient" onClick={() => setIsAddUserModalOpen(true)}> 
                    <PlusCircle className="mr-2 h-4 w-4" /> Add First User
                </Button>
                )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Groups</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarUrl ? undefined : user.dataAiHint || "profile person"}/>
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? "default" : "secondary"} className={user.role === 'Admin' ? 'bg-primary hover:bg-primary/90' : ''}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.groups && user.groups.length > 0 
                        ? user.groups.map(g => <Badge key={g.id} variant="outline" className="mr-1 mb-1">{g.name}</Badge>) 
                        : <span className="text-xs text-muted-foreground">No groups</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {session?.user?.role === 'Admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => confirmDeleteUser(user)} 
                              disabled={session?.user?.id === user.id} 
                              className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
            <div className="mt-6 p-3 bg-secondary/30 border border-secondary/50 rounded-md flex items-start text-sm text-secondary-foreground">
            <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-primary shrink-0" />
            <div>
              <span className="font-semibold">Security Note:</span> User creation, deletion, and modification of roles/permissions are restricted to 'Admin' users. User passwords are securely hashed using bcrypt.
            </div>
          </div>
        </CardContent>
      </Card>
      <React.Fragment>
        <AddUserModal 
          isOpen={isAddUserModalOpen} 
          onOpenChange={setIsAddUserModalOpen}
          onAddUser={handleAddUser}
        />
        {selectedUserForEdit && (
          <EditUserModal
            isOpen={isEditUserModalOpen}
            onOpenChange={(isOpen) => {
              setIsEditUserModalOpen(isOpen);
              if (!isOpen) setSelectedUserForEdit(null); 
            }}
            onEditUser={handleEditUser}
            user={selectedUserForEdit}
          />
        )}
        {userToDelete && (
          <AlertDialog open={!!userToDelete} onOpenChange={(open) => { if(!open) setUserToDelete(null);}}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user <strong>{userToDelete.name}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({ variant: "destructive" })}>
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </React.Fragment>
    </div>
  );
}
    
