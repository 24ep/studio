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
import { Edit3, ShieldCheck, Users, Filter, ChevronsUpDown, Check as CheckIcon, Loader2, UserCog, Settings, KeyRound, UserCircle, Palette, Save } from 'lucide-react';
import type { UserProfile, PlatformModuleId, UserGroup, PlatformModuleCategory } from '@/lib/types';
import { PLATFORM_MODULES, PLATFORM_MODULE_CATEGORIES } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

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
  isSelfEdit?: boolean;
}

const groupedPermissions = Object.values(PLATFORM_MODULE_CATEGORIES).map(category => ({
  category,
  permissions: PLATFORM_MODULES.filter(p => p.category === category)
}));


export function EditUserModal({ isOpen, onOpenChange, onEditUser, user, isSelfEdit = false }: EditUserModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>(isSelfEdit ? 'general' : 'general');
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: { name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [], groupIds: [] },
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
      setActiveTab(isSelfEdit ? 'general' : 'general'); 

      if (!isSelfEdit) {
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
      }
    } else if (!isOpen) {
      form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [], groupIds: [] });
      setAvailableGroups([]);
      setGroupSearchQuery('');
      setActiveTab('general');
    }
  }, [user, isOpen, form, toast, isSelfEdit]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    const payload: Partial<EditUserFormValues> = { ...data }; 
    if (!payload.newPassword) { 
      delete payload.newPassword;
    }
    if (isSelfEdit) {
      delete (payload as any).role;
      delete (payload as any).modulePermissions;
      delete (payload as any).groupIds;
    }
    await onEditUser(user.id, payload as EditUserFormValues);
  };
  
  if (!user && isOpen) return null;

  const filteredGroups = groupSearchQuery
    ? availableGroups.filter(group => group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()))
    : availableGroups;

  const dialogTitle = isSelfEdit ? "Edit My Profile" : `Edit User: ${user?.name || 'N/A'}`;
  const dialogDescription = isSelfEdit 
    ? "Update your personal information. Leave 'New Password' blank to keep your current password."
    : "Update user details, assign roles, groups, and permissions.";

  const navItems = [
    { id: 'general', label: 'General Information', icon: UserCircle },
    ...(!isSelfEdit ? [{ id: 'permissions', label: 'Groups & Permissions', icon: ShieldCheck }] : [])
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [], groupIds: [] });
        setAvailableGroups([]);
        setGroupSearchQuery('');
        setActiveTab('general');
      }
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-grow overflow-hidden">
          {/* Left Navigation Menu */}
          <aside className="w-1/4 border-r p-4 space-y-1 bg-muted/30">
            {navItems.map(item => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => setActiveTab(item.id as 'general' | 'permissions')}
                className={cn(
                  "w-full justify-start text-sm",
                  activeTab === item.id && "btn-primary-gradient text-primary-foreground",
                )}
              >
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
              </Button>
            ))}
          </aside>

          {/* Right Content Area */}
          <main className="w-3/4 flex-grow overflow-hidden">
            <ScrollArea className="h-full p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {activeTab === 'general' && (
                    <div className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      
                      {!isSelfEdit && (
                        <FormField control={form.control} name="role" render={({ field }) => (
                          <FormItem><FormLabel>System Role *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                              <SelectContent>{userRoleOptions.map(roleValue => (<SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
                             <p className="text-xs text-muted-foreground mt-1">This is the primary system role. Specific permissions are managed via groups and direct assignments.</p>
                          </FormItem>)}
                        />
                      )}
                      <FormField control={form.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password (Optional)</FormLabel><FormControl><Input type="password" {...field} placeholder="Leave blank to keep current" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  )}

                  {activeTab === 'permissions' && !isSelfEdit && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="flex items-center text-md font-medium"><Users className="mr-2 h-5 w-5 text-primary" /> Assign to Groups (Roles)</Label>
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

                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="flex items-center text-md font-medium"><ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Direct Module Permissions</Label>
                        <div className="space-y-4 rounded-md border p-4 max-h-60 overflow-y-auto">
                          {groupedPermissions.map(group => (
                            <div key={group.category}>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1.5">{group.category}</h4>
                              {group.permissions.map((module) => (
                                <FormField key={module.id} control={form.control} name="modulePermissions"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                      <FormControl><Checkbox className="checkbox-green mt-1" checked={field.value?.includes(module.id)}
                                        onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), module.id]) : field.onChange((field.value || []).filter(v => v !== module.id))}
                                      /></FormControl>
                                      <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-normal">{module.label}</FormLabel>
                                        <p className="text-xs text-muted-foreground">{module.description}</p>
                                      </div>
                                    </FormItem>
                                  )}
                                />))}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">These are direct permissions. User also inherits permissions from assigned groups.</p>
                      </div>
                    </div>
                  )}

                  <DialogFooter className="pt-6 mt-auto sticky bottom-0 bg-background pb-1">
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting} className="btn-primary-gradient">
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>}
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

