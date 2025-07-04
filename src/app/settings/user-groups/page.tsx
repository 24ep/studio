
// src/app/settings/user-groups/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserGroup } from '@/lib/types';
import { PlusCircle, Edit3, Trash2, Save, Loader2, ServerCrash, ShieldAlert, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
});
type GroupFormValues = z.infer<typeof groupFormSchema>;

export default function UserGroupsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: '', description: '' },
  });

  const fetchGroups = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/user-groups');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user groups' }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }
      const data: UserGroup[] = await response.json();
      setGroups(data);
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname, signIn]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
        setFetchError("You do not have permission to manage user groups.");
        setIsLoading(false);
      } else {
        fetchGroups();
      }
    }
  }, [sessionStatus, session, fetchGroups, pathname, signIn]);

  const handleOpenModal = (group: UserGroup | null = null) => {
    setEditingGroup(group);
    form.reset(group ? { name: group.name, description: group.description || '' } : { name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: GroupFormValues) => {
    const url = editingGroup ? `/api/settings/user-groups/${editingGroup.id}` : '/api/settings/user-groups';
    const method = editingGroup ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${editingGroup ? 'update' : 'create'} group`);
      
      toast({ title: `Group ${editingGroup ? 'Updated' : 'Created'}`, description: `Group "${result.name}" was successfully ${editingGroup ? 'updated' : 'created'}.` });
      setIsModalOpen(false);
      fetchGroups(); 
    } catch (error) {
      toast({ title: `Error ${editingGroup ? 'Updating' : 'Creating'} Group`, description: (error as Error).message, variant: "destructive" });
    }
  };

  const confirmDelete = (group: UserGroup) => {
    setGroupToDelete(group);
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      const response = await fetch(`/api/settings/user-groups/${groupToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete group');
      }
      toast({ title: "Group Deleted", description: `Group "${groupToDelete.name}" has been deleted.` });
      fetchGroups(); 
    } catch (error) {
      toast({ title: "Error Deleting Group", description: (error as Error).message, variant: "destructive" });
    } finally {
      setGroupToDelete(null);
    }
  };
  
  if (sessionStatus === 'loading' || (isLoading && !fetchError && groups.length === 0 && sessionStatus === 'authenticated')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    const isPermissionError = fetchError === "You do not have permission to manage user groups.";
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isPermissionError ? (
            <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
        ) : (
            <Button onClick={fetchGroups} className="btn-hover-primary-gradient">Try Again</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center"><Users className="mr-3 h-6 w-6 text-primary"/>User Groups</h1>
        <Button onClick={() => handleOpenModal()} className="btn-primary-gradient">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Group
        </Button>
      </div>
      <CardDescription>
        Manage user groups to organize users and bulk-assign permissions (permission assignment via groups is a future enhancement).
      </CardDescription>

      <Card>
        <CardContent className="pt-6">
          {groups.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-center py-8">No user groups defined yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">{group.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(group)} className="mr-1 h-8 w-8">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(group)} className="text-destructive hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit' : 'Add New'} User Group</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update the details of this group.' : 'Define a new group for users.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting} className="btn-primary-gradient">
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                {editingGroup ? 'Save Changes' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {groupToDelete && (
        <AlertDialog open={!!groupToDelete} onOpenChange={(open) => { if(!open) setGroupToDelete(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the user group "<strong>{groupToDelete.name}</strong>". This action cannot be undone.
                Deleting a group does not delete its users, but removes them from this group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGroupToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete Group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
