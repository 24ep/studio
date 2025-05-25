// src/components/users/AddUserModal.tsx
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
import { UserPlus, ShieldCheck } from 'lucide-react';
import type { UserProfile, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const addUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(userRoleOptions, { required_error: "Role is required" }),
  modulePermissions: z.array(z.enum(platformModuleIds)).optional().default([]),
});

export type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (data: AddUserFormValues) => Promise<void>;
}

export function AddUserModal({ isOpen, onOpenChange, onAddUser }: AddUserModalProps) {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Recruiter',
      modulePermissions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'Recruiter',
        modulePermissions: [],
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddUserFormValues) => {
    await onAddUser(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset();
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" /> Add New User
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new application user and assign permissions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pl-1">
            <div>
              <Label htmlFor="name-add">Full Name *</Label>
              <Input id="name-add" {...form.register('name')} className="mt-1" />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email-add">Email Address *</Label>
              <Input id="email-add" type="email" {...form.register('email')} className="mt-1" />
              {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password-add">Password *</Label>
              <Input id="password-add" type="password" {...form.register('password')} className="mt-1" />
              {form.formState.errors.password && <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="role-add">Role *</Label>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="role-add" className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoleOptions.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.role && <p className="text-sm text-destructive mt-1">{form.formState.errors.role.message}</p>}
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
                {form.formState.isSubmitting ? 'Adding User...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
