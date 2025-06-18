
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Edit3, ShieldCheck, Users, Filter, ChevronsUpDown, Check as CheckIcon } from 'lucide-react';
import type { UserProfile, PlatformModuleId, UserGroup } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(userRoleOptions as [UserProfile['role'], ...UserProfile['role'][]], { required_error: "Role is required" }),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal('')),
  modulePermissions: z.array(z.enum(platformModuleIds)).optional().default([]),
  groupIds: z.array(z.string().uuid()).optional().default([]),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditUser: (userId: string, data: EditUserFormValues) => Promise<void>;
  user: UserProfile | null;
}

export function EditUserModal({ isOpen, onOpenChange, onEditUser, user }: EditUserModalProps) {
  const { toast } = useToast();
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');


  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Recruiter',
      newPassword: '',
      modulePermissions: [],
      groupIds: [],
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        newPassword: '',
        modulePermissions: user.modulePermissions || [],
        groupIds: user.groups?.map(g => g.id) || [],
      });

      const fetchGroups = async () => {
        try {
          const response = await fetch('/api/settings/user-groups');
          if (!response.ok) throw new Error('Failed to fetch user groups');
          const data: UserGroup[] = await response.json();
          setAvailableGroups(data);
        } catch (error) {
          console.error("Error fetching groups:", error);
          toast({ title: "Error", description: "Could not load user groups for selection.", variant: "destructive" });
        }
      };
      fetchGroups();

    } else if (!isOpen) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [], groupIds: [] });
        setAvailableGroups([]);
        setGroupSearchQuery('');
    }
  }, [user, isOpen, form, toast]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    const payload: EditUserFormValues = { ...data };
    if (payload.newPassword === '' || payload.newPassword === undefined) {
      delete payload.newPassword;
    }
    await onEditUser(user.id, payload);
  };
  
  if (!user && isOpen) return null;

  const filteredGroups = groupSearchQuery
    ? availableGroups.filter(group => group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()))
    : availableGroups;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [], groupIds: [] });
        setAvailableGroups([]);
        setGroupSearchQuery('');
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit User: {user?.name || 'N/A'}
          </DialogTitle>
          <DialogDescription>
            Update the user's details, permissions, and group memberships. Leave "New Password" blank to keep current password.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pl-1">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>{userRoleOptions.map(roleValue => (<SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>)}
              />
              <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password (Optional)</FormLabel><FormControl><Input type="password" {...field} placeholder="Leave blank to keep current" /></FormControl><FormMessage /></FormItem>)} />

              <div className="space-y-2">
                <FormLabel className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Module Permissions</FormLabel>
                <div className="space-y-2 rounded-md border p-4 max-h-32 overflow-y-auto">
                  {PLATFORM_MODULES.map((module) => (
                    <FormField key={module.id} control={form.control} name="modulePermissions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl><Checkbox className="checkbox-green" checked={field.value?.includes(module.id)}
                            onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), module.id]) : field.onChange((field.value || []).filter(v => v !== module.id))}
                          /></FormControl>
                          <FormLabel className="text-sm font-normal">{module.label}</FormLabel>
                        </FormItem>
                      )}
                    />))}
                </div><FormMessage />
              </div>
              
              <div className="space-y-2">
                <FormLabel className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> User Groups</FormLabel>
                <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={groupSearchOpen} className="w-full justify-between">
                       {form.getValues("groupIds")?.length > 0 ? `${form.getValues("groupIds")?.length} group(s) selected` : "Select groups..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                    <div className="p-2"><Input placeholder="Search group..." value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} className="h-9" /></div>
                    <ScrollArea className="max-h-40">
                      {availableGroups.length === 0 && <p className="p-2 text-xs text-muted-foreground text-center">No groups available.</p>}
                      {filteredGroups.length === 0 && groupSearchQuery && <p className="p-2 text-xs text-muted-foreground text-center">No group found.</p>}
                      {filteredGroups.map(group => (
                        <FormField key={group.id} control={form.control} name="groupIds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 px-2 py-1.5 hover:bg-accent rounded-sm">
                              <FormControl><Checkbox checked={field.value?.includes(group.id)}
                                onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), group.id]) : field.onChange((field.value || []).filter(v => v !== group.id))}
                              /></FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer flex-grow">{group.name}</FormLabel>
                            </FormItem>
                          )} />
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </div>

              <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-1">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
