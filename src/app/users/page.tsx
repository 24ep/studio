
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { PlusCircle, UsersRound, ShieldAlert, Edit3, Trash2, AlertTriangle } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { EditUserModal, type EditUserFormValues } from "@/components/users/EditUserModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { signIn, useSession } from "next-auth/react";


export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [authError, setAuthError] = useState(false);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);


  const fetchUsers = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
        setIsLoading(false);
        setAuthError(true);
        return;
    }
    setIsLoading(true);
    setAuthError(false);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401) {
             setAuthError(true); // Unauthorized or forbidden
             setIsLoading(false);
             return;
        }
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data: UserProfile[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (!String((error as Error).message).includes("401") && !String((error as Error).message).includes("403")) {
        toast({ title: "Error Fetching Users", description: (error as Error).message, variant: "destructive" });
      }
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  }, [toast, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchUsers();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setAuthError(true);
    }
  }, [sessionStatus, fetchUsers]);

  const handleAddUser = async (data: AddUserFormValues) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }
      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      toast({ title: "Success", description: `User ${newUser.name} added successfully.` });
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      toast({ title: "Success", description: `User ${updatedUser.name} updated successfully.` });
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
        const errorData = await response.json();
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

  if (sessionStatus === 'loading' || (isLoading && !authError)) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded w-40"></div>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="h-8 bg-muted rounded w-1/2"></CardTitle>
                    <CardDescription className="h-4 bg-muted rounded w-3/4 mt-1"></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="h-12 bg-muted border-b"></div>
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center p-4 border-b h-[70px]">
                                <div className="h-9 w-9 rounded-full bg-muted mr-3"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                </div>
                                <div className="h-6 bg-muted rounded w-1/4 ml-auto"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You do not have permission to manage users or your session has expired.
        </p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div> 
        <Button className="w-full sm:w-auto" onClick={() => setIsAddUserModalOpen(true)}> 
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
             <UsersRound className="mr-2 h-5 w-5 text-primary" /> App Users
          </CardTitle>
          <CardDescription>
            Manage application users and their roles. These operations interact with the PostgreSQL database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && users.length === 0 ? (
             <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? ( 
            <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found in the database.</p>
                 <Button className="mt-4" onClick={() => setIsAddUserModalOpen(true)}> 
                    <PlusCircle className="mr-2 h-4 w-4" /> Add First User
                </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8" onClick={() => openEditModal(user)}>
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => confirmDeleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        {userToDelete && userToDelete.id === user.id && ( 
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
                        )}
                      </AlertDialog>
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
              <span className="font-semibold">Security Note:</span> User creation, deletion, and role modification are restricted to 'Admin' users. Passwords should be securely hashed in a production environment; this prototype stores them in plaintext.
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
    </div>
  );
}
    