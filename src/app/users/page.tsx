
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UsersRound, ShieldAlert, Edit3, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog"


export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);


  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Replace with API call when backend is ready:
      // const response = await fetch('/api/users');
      // if (!response.ok) throw new Error('Failed to fetch users');
      // const data = await response.json();
      // For now, using directly imported mock data and simulating async
      const dataModule = await import('@/lib/data');
      setUsers(dataModule.mockAppUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClient(true);
    fetchUsers();
  }, [fetchUsers]);

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
      setUsers(prev => [...prev, newUser]);
      toast({ title: "Success", description: `User ${newUser.name} added successfully.` });
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const openEditModal = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditUserModalOpen(true);
  };

  const confirmDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    // The AlertDialog will be triggered by the button if userToDelete is set
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
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setUserToDelete(null); // Close dialog
    }
  };


  if (!isClient || isLoading) {
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


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div></div> {/* Placeholder for title, handled by Header */}
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
            Manage application users and their roles. These operations are placeholders and interact with mock data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? ( 
            <div className="text-center py-10">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No users found.</p>
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
                      <Badge variant={user.role === 'Admin' ? "default" : "secondary"}>
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
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => setUserToDelete(user)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        {userToDelete && userToDelete.id === user.id && ( // Only render content if this is the user to delete
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
            <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-primary" />
            <div>
              <span className="font-semibold">Permissions Note:</span> In a production system, user creation, deletion, and role modification would require administrative privileges and backend authorization checks. These mock APIs do not enforce such roles yet.
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
            if (!isOpen) setSelectedUserForEdit(null); // Clear selection when modal closes
          }}
          onEditUser={handleEditUser}
          user={selectedUserForEdit}
        />
      )}
    </div>
  );
}

    