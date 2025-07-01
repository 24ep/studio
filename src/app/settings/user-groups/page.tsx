"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import UserGroupsTable from '@/components/settings/UserGroupsTable';
import UserGroupsForm from '@/components/settings/UserGroupsForm';
import UserGroupsModal from '@/components/settings/UserGroupsModal';
import type { UserGroup, PlatformModule, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES, PLATFORM_MODULE_CATEGORIES } from '@/lib/types';
import { PlusCircle, Edit3, Trash2, Save, Loader2, ServerCrash, ShieldAlert, Users, ShieldCheck, Settings2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Toggle } from "@/components/ui/toggle";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.enum(platformModuleIds)).optional().default([]),
  is_default: z.boolean().optional().default(false),
});
type RoleFormValues = z.infer<typeof roleFormSchema>;

// Group permissions by category for display
const groupedPermissions = Object.values(PLATFORM_MODULE_CATEGORIES).map(category => ({
  category,
  permissions: PLATFORM_MODULES.filter(p => p.category === category)
}));

export default function RolesPermissionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [roles, setRoles] = useState<UserGroup[]>([]); // UserGroups are now "Roles"
  const [selectedRole, setSelectedRole] = useState<UserGroup | null>(null);
  const selectedRoleIdRef = useRef<string | null>(null); // Ref to store selected role ID
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserGroup | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<UserGroup | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: '', description: '', permissions: [], is_default: false },
  });

  const fetchRolesAndSelect = useCallback(async (roleIdToSelect?: string | null) => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/user-groups');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch roles' }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }
      const data: UserGroup[] = await response.json();
      setRoles(data);
      
      if (roleIdToSelect) {
        const roleToReselect = data.find(r => r.id === roleIdToSelect);
        setSelectedRole(roleToReselect || (data.length > 0 ? data[0] : null));
        selectedRoleIdRef.current = roleToReselect?.id || (data.length > 0 ? data[0].id : null);
      } else if (data.length > 0 && !selectedRoleIdRef.current) { // Use ref instead of selectedRole
        setSelectedRole(data[0]);
        selectedRoleIdRef.current = data[0].id;
      } else if (data.length === 0) {
        setSelectedRole(null);
        selectedRoleIdRef.current = null;
      }
      // If a role was already selected, and it's still in the list, keep it.
      // If it was deleted, then the selection will clear or pick the first if list not empty.

    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, pathname]); // Removed selectedRole from dependencies

  useEffect(() => {
    // Debug: Log session and permissions
    if (session) {
      console.log('[DEBUG] Session:', session);
      console.log('[DEBUG] User role:', session.user.role);
      console.log('[DEBUG] User modulePermissions:', session.user.modulePermissions);
    }
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
        setFetchError("You do not have permission to manage roles & permissions.");
        setIsLoading(false);
      } else {
        fetchRolesAndSelect(selectedRoleIdRef.current); // Fetch with current ref ID if set
      }
    }
  }, [sessionStatus, session, pathname, fetchRolesAndSelect]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  const handleSelectRole = (role: UserGroup) => {
    setSelectedRole(role);
    selectedRoleIdRef.current = role.id; // Update ref when user explicitly selects
  };

  const handleOpenModal = (role: UserGroup | null = null) => {
    setEditingRole(role);
    form.reset(role ? { name: role.name, description: role.description || '', permissions: role.permissions || [], is_default: role.is_default || false } : { name: '', description: '', permissions: [], is_default: false });
    setIsModalOpen(true);
  };

  const handleRoleFormSubmit = async (data: RoleFormValues) => {
    const url = editingRole ? `/api/settings/user-groups/${editingRole.id}` : '/api/settings/user-groups';
    const method = editingRole ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${editingRole ? 'update' : 'create'} role`);
      
      toast.success(`Role "${result.name}" was successfully ${editingRole ? 'updated' : 'created'}.`);
      setIsModalOpen(false);
      fetchRolesAndSelect(result.id); // Refresh list and attempt to select the created/edited role

    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  
  const handlePermissionToggle = async (permissionId: PlatformModuleId, role: UserGroup) => {
    if (role.is_system_role) {
      toast.error("Permissions for system roles cannot be changed.");
      return;
    }
    const currentPermissions = role.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(p => p !== permissionId)
      : [...currentPermissions, permissionId];

    try {
      const response = await fetch(`/api/settings/user-groups/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: role.name, description: role.description, permissions: newPermissions, is_default: role.is_default }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to update role permissions.");
      
      toast.success(`Permissions for role "${role.name}" updated.`);
      // Update local state for immediate UI feedback
      setSelectedRole(prev => prev ? { ...prev, permissions: newPermissions } : null);
      setRoles(prevRoles => prevRoles.map(r => r.id === role.id ? { ...r, permissions: newPermissions } : r));
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const confirmDelete = (role: UserGroup) => {
    setRoleToDelete(role);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    if (roleToDelete.is_system_role) {
      toast.error("System roles cannot be deleted.");
      setRoleToDelete(null);
      return;
    }
    try {
      const response = await fetch(`/api/settings/user-groups/${roleToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete role');
      }
      toast.success('Role deleted successfully.');
      fetchRolesAndSelect(null); // Refresh and select first item or nothing
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRoleToDelete(null);
    }
  };

  if (sessionStatus === 'loading' || (isLoading && !fetchError && roles.length === 0 && !selectedRole)) {
    return ( <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoading) {
    const isPermissionError = fetchError === "You do not have permission to manage roles & permissions.";
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {isPermissionError ? (<Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>) : (<Button onClick={() => fetchRolesAndSelect(selectedRoleIdRef.current)} className="btn-hover-primary-gradient">Try Again</Button>)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Panel: Roles List */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Roles</CardTitle>
               <Button size="sm" onClick={() => handleOpenModal()} className="btn-primary-gradient h-8">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Create
              </Button>
            </div>
            <CardDescription className="text-xs">Select a role to view or edit its permissions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]"> {/* Adjust height as needed */}
              {isLoading && roles.length === 0 ? (
                 <div className="p-4 text-sm text-muted-foreground text-center"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading roles...</div>
              ) : roles.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No roles defined.</p>
              ) : (
                <div className="space-y-0">
                  {roles.map((role) => (
                    <Button
                      key={role.id}
                      variant="ghost"
                      onClick={() => handleSelectRole(role)}
                      className={cn(
                        "w-full justify-start rounded-none p-4 text-left h-auto border-b border-border last:border-b-0",
                        selectedRole?.id === role.id && "bg-primary/10 text-primary font-semibold "
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{role.name} {role.is_system_role && <Badge variant="secondary" className="ml-1 text-xs">System</Badge>}</span>
                            <span className="text-xs text-muted-foreground">{role.user_count || 0} users</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description || 'No description'}</p>
                        {role.is_default && <Badge variant="outline" className="mt-1 text-xs">Default</Badge>}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel: Permissions for Selected Role */}
        <Card className="md:col-span-2 shadow-sm">
          {selectedRole ? (
            <>
              <CardHeader className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{selectedRole.name} Permissions</CardTitle>
                    <CardDescription className="text-xs">Configure what users with the &quot;{selectedRole.name}&quot; role can do.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!selectedRole.is_system_role && <Button variant="outline" size="sm" onClick={() => handleOpenModal(selectedRole)}><Edit3 className="mr-1.5 h-3.5 w-3.5"/> Edit Role</Button>}
                    {!selectedRole.is_system_role && <Button variant="destructive" size="sm" onClick={() => confirmDelete(selectedRole)}><Trash2 className="mr-1.5 h-3.5 w-3.5"/> Delete Role</Button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[calc(100vh-18rem)]"> {/* Adjust height */}
                  {groupedPermissions.map(group => (
                    <div key={group.category} className="mb-6">
                      <h3 className="text-md font-semibold text-primary mb-2 border-b pb-1">{group.category}</h3>
                      <div className="space-y-3">
                        {group.permissions.map(perm => (
                          <div key={perm.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div>
                              <Label htmlFor={`${selectedRole.id}-${perm.id}`} className="font-medium text-sm">{perm.label}</Label>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                            <Toggle
                              checked={(selectedRole.permissions || []).includes(perm.id)}
                              onCheckedChange={() => handlePermissionToggle(perm.id, selectedRole)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a role from the left to view and manage its permissions.</p>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole ? `Update the details for the &quot;${editingRole.name}&quot; role.` : 'Define a new role. Permissions are managed on the main page after creation.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRoleFormSubmit)} className="space-y-4 py-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name *</FormLabel>
                  <FormControl><Input {...field} disabled={editingRole?.is_system_role} /></FormControl>
                  <FormMessage />
                   {editingRole?.is_system_role && <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>}
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_default" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                  <FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(checked)} /></FormControl>
                  <FormLabel className="font-normal">Set as Default Role</FormLabel>
                </FormItem>
              )} />
            </form>
          </Form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting || (editingRole?.is_system_role && form.getValues("name") === editingRole.name && !form.getFieldState("description").isDirty && !form.getFieldState("is_default").isDirty )} 
              className="btn-primary-gradient flex items-center gap-2"
              onClick={form.handleSubmit(handleRoleFormSubmit)}
            >
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {roleToDelete && (
        <AlertDialog open={!!roleToDelete} onOpenChange={(open) => { if(!open) setRoleToDelete(null);}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the role &quot;<strong>{roleToDelete.name}</strong>&quot;. This action cannot be undone.
                Users will lose permissions granted by this role.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                Delete Role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

