// src/components/users/EditUserModal.tsx
"use client";

import { useEffect } from 'react';
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
import { Edit3, ShieldCheck } from 'lucide-react';
import type { UserProfile, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { FormField, FormControl, FormItem, FormLabel } from '../ui/form'; // Added Form components for checkbox

const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"), 
  role: z.enum(userRoleOptions, { required_error: "Role is required" }),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal('')),
  modulePermissions: z.array(z.enum(platformModuleIds)).optional().default([]),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditUser: (userId: string, data: EditUserFormValues) => Promise<void>;
  user: UserProfile | null;
}

export function EditUserModal({ isOpen, onOpenChange, onEditUser, user }: EditUserModalProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Recruiter',
      newPassword: '',
      modulePermissions: [],
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
      });
    } else if (!isOpen) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [] });
    }
  }, [user, isOpen, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    const payload: EditUserFormValues = { ...data };
    if (payload.newPassword === '') {
      delete payload.newPassword;
    }
    await onEditUser(user.id, payload);
  };
  
  if (!user && isOpen) return null; // Should not happen if modal is opened correctly

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ name: '', email: '', role: 'Recruiter', newPassword: '', modulePermissions: [] });
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit User: {user?.name || 'N/A'}
          </DialogTitle>
          <DialogDescription>
            Update the user's details and permissions. Leave "New Password" blank to keep current password.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pl-1">
            <div>
              <Label htmlFor="name-edit">Full Name *</Label>
              <Input id="name-edit" {...form.register('name')} className="mt-1" />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email-edit">Email Address *</Label>
              <Input id="email-edit" type="email" {...form.register('email')} className="mt-1" />
              {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="role-edit">Role *</Label>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="role-edit" className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoleOptions.map(roleValue => (
                        <SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.role && <p className="text-sm text-destructive mt-1">{form.formState.errors.role.message}</p>}
            </div>
            <div>
              <Label htmlFor="newPassword-edit">New Password (Optional)</Label>
              <Input id="newPassword-edit" type="password" {...form.register('newPassword')} className="mt-1" placeholder="Leave blank to keep current password" />
              {form.formState.errors.newPassword && <p className="text-sm text-destructive mt-1">{form.formState.errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Module Permissions</Label>
              <div className="space-y-2 rounded-md border p-4 max-h-48 overflow-y-auto">
                {PLATFORM_MODULES.map((module) => (
                  <FormField
                    key={module.id}
                    control={form.control}
                    name="modulePermissions"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(module.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), module.id])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== module.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {module.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
               {form.formState.errors.modulePermissions && <p className="text-sm text-destructive mt-1">{form.formState.errors.modulePermissions.message}</p>}
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-1">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
