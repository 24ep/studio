"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Palette, ImageUp, Trash2, Loader2, XCircle, PenSquare, ServerCrash, ShieldAlert, Settings2, Wallpaper, Droplets, Type, Sidebar as SidebarIcon, RotateCcw, Eye, EyeOff, Monitor, Sun, Moon, Zap, StickyNote, Paintbrush, LayoutDashboard, Sidebar as SidebarMenuIcon, LogIn, Edit3, Users, ShieldCheck, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting, LoginPageBackgroundType, SystemSettingKey, LoginPageLayoutType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { UserProfile, PlatformModuleId, UserGroup, PlatformModuleCategory } from '@/lib/types';
import { PLATFORM_MODULES, PLATFORM_MODULE_CATEGORIES } from '@/lib/types';
import { toast } from 'react-hot-toast';

const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(userRoleOptions as [UserProfile['role'], ...UserProfile['role'][]], { required_error: "Role is required" }),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal('')),
  forcePasswordChange: z.boolean().optional().default(false),
  authenticationMethod: z.enum(['basic', 'azure']).optional().default('basic'),
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
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>(isSelfEdit ? 'general' : 'general');
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [groupSearchOpen, setGroupSearchOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: { name: '', email: '', role: 'Recruiter', newPassword: '', forcePasswordChange: false, authenticationMethod: 'basic', modulePermissions: [], groupIds: [] },
  });

  // Check if current user has permission to force change passwords
  const canForcePasswordChange = session?.user?.role === 'Admin' || 
    session?.user?.modulePermissions?.includes('USERS_MANAGE');

  // Check if current user has permission to manage authentication methods
  const canManageAuthentication = session?.user?.role === 'Admin' || 
    session?.user?.modulePermissions?.includes('USERS_MANAGE');

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        newPassword: '',
        forcePasswordChange: false,
        authenticationMethod: user.authenticationMethod || 'basic',
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
            toast.error("Could not load user groups for selection.");
          }
        };
        fetchGroups();
      }
    } else if (!isOpen) {
      form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', forcePasswordChange: false, authenticationMethod: 'basic', modulePermissions: [], groupIds: [] });
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
    if (!payload.forcePasswordChange) {
      delete payload.forcePasswordChange;
    }
    if (isSelfEdit) {
      delete (payload as any).role;
      delete (payload as any).modulePermissions;
      delete (payload as any).groupIds;
      delete (payload as any).newPassword;
      delete (payload as any).forcePasswordChange;
      delete (payload as any).authenticationMethod;
    }
    await onEditUser(user.id, payload as EditUserFormValues);
  };

  if (!user && isOpen) return null;

  const filteredGroups = groupSearchQuery
    ? availableGroups.filter(group => group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()))
    : availableGroups;

  const dialogTitle = isSelfEdit ? "Edit My Profile" : `Edit User: ${user?.name || 'N/A'}`;
  const dialogDescription = isSelfEdit
    ? "Update your personal information. Use the Change Password function to update your password."
    : "Update user details, assign roles, groups, and permissions.";

  const navItems = [
    { id: 'general', label: 'General Information', icon: Users },
    ...(!isSelfEdit ? [{ id: 'permissions', label: 'Groups & Permissions', icon: ShieldCheck }] : [])
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', forcePasswordChange: false, authenticationMethod: 'basic', modulePermissions: [], groupIds: [] });
        setAvailableGroups([]);
        setGroupSearchQuery('');
        setActiveTab('general');
      }
    }}>
      <DialogContent className="sm:max-w-6xl lg:max-w-7xl xl:max-w-8xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-8 pb-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="flex items-center text-2xl font-bold">
            <Edit3 className="mr-3 h-6 w-6 text-primary" /> {typeof dialogTitle === 'object' ? JSON.stringify(dialogTitle) : dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">{typeof dialogDescription === 'object' ? JSON.stringify(dialogDescription) : dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row flex-grow overflow-hidden p-8 gap-8">
          {!isSelfEdit && (
            <aside className="lg:w-80 border-b lg:border-b-0 lg:border-r pb-8 lg:pb-0 lg:pr-8 space-y-2">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Navigation</h3>
              </div>
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id as 'general' | 'permissions')}
                  className={cn(
                    "w-full justify-start text-base py-3 px-4",
                    activeTab === item.id && "btn-primary-gradient text-primary-foreground shadow-lg",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" /> {typeof item.label === 'object' ? JSON.stringify(item.label) : item.label}
                </Button>
              ))}
            </aside>
          )}

          <main className={cn("flex-grow overflow-hidden flex-1")}>
            <ScrollArea className="h-full pr-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormField 
                          control={form.control} 
                          name="name" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Full Name *</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-12 text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                        <FormField 
                          control={form.control} 
                          name="email" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} className="h-12 text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>
                      
                      {!isSelfEdit && (
                        <FormField 
                          control={form.control} 
                          name="role" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">System Role *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {userRoleOptions.map(roleValue => (
                                    <SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              <p className="text-sm text-muted-foreground mt-2">
                                This is the primary system role. Specific permissions are managed via groups and direct assignments.
                              </p>
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {!isSelfEdit && canManageAuthentication && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                          <Label className="text-base font-medium">Authentication Method</Label>
                          <FormField 
                            control={form.control} 
                            name="authenticationMethod" 
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup 
                                    onValueChange={field.onChange} 
                                    value={field.value} 
                                    className="flex flex-col space-y-3"
                                  >
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                      <RadioGroupItem value="basic" id="auth-basic" />
                                      <Label htmlFor="auth-basic" className="flex flex-col cursor-pointer">
                                        <span className="font-medium">Basic Authentication</span>
                                        <span className="text-sm text-muted-foreground">
                                          User signs in with email and password
                                        </span>
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                      <RadioGroupItem value="azure" id="auth-azure" />
                                      <Label htmlFor="auth-azure" className="flex flex-col cursor-pointer">
                                        <span className="font-medium">Azure AD</span>
                                        <span className="text-sm text-muted-foreground">
                                          User signs in through Microsoft Azure Active Directory
                                        </span>
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <p className="text-sm text-muted-foreground">
                            Email address ({form.watch('email')}) will be used as the primary identifier for both authentication methods.
                          </p>
                        </div>
                      )}
                      
                      {!isSelfEdit && canForcePasswordChange && form.watch('authenticationMethod') === 'basic' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                          <div className="flex items-center space-x-2">
                            <FormField 
                              control={form.control} 
                              name="forcePasswordChange" 
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox 
                                      checked={Boolean(field.value)} 
                                      onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-base font-medium">
                                    Force Password Change
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            When enabled, the user will be required to change their password on next login.
                          </p>
                          
                          {form.watch('forcePasswordChange') && (
                            <FormField 
                              control={form.control} 
                              name="newPassword" 
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">New Password *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="password" 
                                      {...field} 
                                      placeholder="Enter new password (min 6 characters)" 
                                      className="h-12 text-base" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    This password will be set immediately and the user will be required to change it on next login.
                                  </p>
                                </FormItem>
                              )} 
                            />
                          )}
                        </div>
                      )}
                      
                      {!isSelfEdit && !canForcePasswordChange && form.watch('authenticationMethod') === 'basic' && (
                        <FormField 
                          control={form.control} 
                          name="newPassword" 
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">New Password (Optional)</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} placeholder="Leave blank to keep current" className="h-12 text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'permissions' && !isSelfEdit && (
                    <div className="space-y-8">
                      {/* Groups Section */}
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <Label className="flex items-center text-xl font-semibold text-primary">
                            <Users className="mr-3 h-6 w-6" /> User Groups (Roles)
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Assign user to specific groups to inherit their permissions and access levels.
                          </p>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-6 border">
                          <Popover open={groupSearchOpen} onOpenChange={setGroupSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" aria-expanded={groupSearchOpen} className="w-full justify-between h-12 text-base">
                                {form.getValues("groupIds")?.length > 0 ? `${form.getValues("groupIds")?.length} group(s) selected` : "Select groups..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                              <div className="p-3">
                                <Input placeholder="Search group..." value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} className="h-10" />
                              </div>
                              <ScrollArea className="max-h-60">
                                {availableGroups.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No groups available.</p>}
                                {filteredGroups.length === 0 && groupSearchQuery && <p className="p-4 text-sm text-muted-foreground text-center">No group found.</p>}
                                {filteredGroups.map(group => (
                                  <FormField key={group.id} control={form.control} name="groupIds"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 px-3 py-2 hover:bg-accent rounded-sm">
                                        <FormControl>
                                          <Checkbox 
                                            checked={Boolean(field.value?.includes(group.id))}
                                            onCheckedChange={(checked) => 
                                              checked 
                                                ? field.onChange([...(field.value || []), group.id]) 
                                                : field.onChange((field.value || []).filter(v => v !== group.id))
                                            }
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                          <div className="flex flex-col">
                                            <span className="font-medium">{group.name}</span>
                                            {group.description && (
                                              <span className="text-xs text-muted-foreground">{group.description}</span>
                                            )}
                                          </div>
                                        </FormLabel>
                                      </FormItem>
                                    )} 
                                  />
                                ))}
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </div>
                      </div>

                      <Separator className="my-8" />

                      {/* Direct Permissions Section */}
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <Label className="flex items-center text-xl font-semibold text-primary">
                            <ShieldCheck className="mr-3 h-6 w-6" /> Direct Module Permissions
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Grant specific permissions directly to this user, overriding group permissions.
                          </p>
                        </div>
                        
                        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                          {groupedPermissions.map(group => (
                            <div key={group.category} className="bg-muted/20 rounded-lg p-4 border">
                              <h4 className="font-semibold text-lg text-primary mb-4 border-b pb-2">{group.category}</h4>
                              <div className="space-y-4">
                                {group.permissions.map((module) => (
                                  <FormField key={module.id} control={form.control} name="modulePermissions"
                                    render={({ field }) => {
                                      const checked = field.value?.includes(module.id);
                                      return (
                                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-md bg-background hover:bg-muted/50 transition-colors border">
                                          <div className="flex-1">
                                            <Label htmlFor={`${user?.id}-${module.id}`} className="font-medium text-base cursor-pointer">
                                              {module.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                          </div>
                                          <FormControl>
                                            <Toggle
                                              id={`${user?.id}-${module.id}`}
                                              checked={checked}
                                              onCheckedChange={(checked) => 
                                                checked 
                                                  ? field.onChange([...(field.value || []), module.id]) 
                                                  : field.onChange((field.value || []).filter(v => v !== module.id))
                                              }
                                            />
                                          </FormControl>
                                        </FormItem>
                                      );
                                    }} 
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </ScrollArea>
          </main>
        </div>

        <DialogFooter className="p-8 pt-6 border-t bg-muted/20">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-12 px-6 text-base">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting} className="btn-primary-gradient h-12 px-8 text-base">
            {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5"/> : <Save className="mr-2 h-5 w-5"/>}
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
