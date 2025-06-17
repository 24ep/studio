"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"; 
import { PlusCircle, UsersRound, ShieldAlert, Edit3, Trash2, ServerCrash, Loader2, MoreHorizontal, KeyRound } from "lucide-react"; // Added KeyRound
import type { UserProfile, UserGroup } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { EditUserModal, type EditUserFormValues } from "@/components/users/EditUserModal";
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
import { Pagination } from '@/components/ui/pagination';


export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname(); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);


  const fetchUsers = useCallback(async (pageOverride?: number, pageSizeOverride?: number) => {
    if (sessionStatus !== 'authenticated') {
        return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const query = new URLSearchParams();
      query.append('limit', String(pageSizeOverride || pageSize));
      query.append('offset', String(((pageOverride || page) - 1) * (pageSizeOverride || pageSize)));
      const response = await fetch(`/api/users?${query.toString()}`);
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
      const data = await response.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = (error as Error).message || "An unexpected error occurred.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setUsers([]); 
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname, signIn, page, pageSize]); 

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname }); 
    } else if (sessionStatus === 'authenticated') {
        if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USERS_MANAGE')) {
            setFetchError("You do not have permission to view this page.");
            setIsLoading(false);
        } else {
            setPage(1);
            fetchUsers(1);
        }
    }
  }, [sessionStatus, session, fetchUsers, pathname, signIn]); 

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUsers(page);
    }
  }, [page, sessionStatus, fetchUsers]);

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
      setUsers(prev => [result, ...prev].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      toast({ title: "Success", description: `User ${result.name} added successfully.` });
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
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
      setUsers(prev => prev.map(u => (u.id === result.id ? result : u)));
      toast({ title: "Success", description: `User ${result.name} updated successfully.` });
      setIsEditUserModalOpen(false);
      setSelectedUserForEdit(null);
    } catch (error) {
      console.error("Error updating user:", error);
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
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({ title: "Success", description: `User ${userToDelete.name} deleted.` });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error Deleting User", description: (error as Error).message, variant: "destructive" });
    } finally {
      setUserToDelete(null); 
    }
  };

  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !pathname.startsWith('/auth/signin')) || (isLoading && !fetchError && users.length === 0)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Users</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {fetchError === "You do not have permission to view this page." ? (
            <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
        ) : (
            <Button onClick={fetchUsers} className="btn-hover-primary-gradient">Try Again</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div> 
        {session?.user?.role === 'Admin' && (
            <Button className="w-full sm:w-auto btn-primary-gradient" onClick={() => setIsAddUserModalOpen(true)}> 
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
             <UsersRound className="mr-2 h-5 w-5 text-primary" /> App Users
          </CardTitle>
          <CardDescription>
            Manage application users, their roles, and module permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && users.length === 0 && !fetchError ? (
             <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 && !fetchError ? ( 
            <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found in the database.</p>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Groups</TableHead>
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
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? "default" : "secondary"} className={user.role === 'Admin' ? 'bg-primary hover:bg-primary/90' : ''}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
           <div className="mt-4 p-3 bg-secondary/30 border border-secondary/50 rounded-md flex items-start text-sm text-secondary-foreground">
            <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-primary shrink-0" />
            <div>
              <span className="font-semibold">Security Note:</span> User creation, deletion, and modification of roles/permissions are restricted to 'Admin' users. User passwords are securely hashed using bcrypt.
            </div>
          </div>
        </CardContent>
      </Card>
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
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
