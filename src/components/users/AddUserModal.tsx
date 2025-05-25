
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
import { UserPlus } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];

const addUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(userRoleOptions, { required_error: "Role is required" }),
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
      role: 'Recruiter', // Default role
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ // Reset form with default values when modal becomes visible
        name: '',
        email: '',
        password: '',
        role: 'Recruiter',
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: AddUserFormValues) => {
    await onAddUser(data);
    // Modal closing and further form reset can be handled by parent or here based on promise resolution
    // Example: if onAddUser resolves, then onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open); // Call the prop to update parent state
      if (!open) {
        form.reset(); // Also reset form when dialog is closed via X or overlay
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" /> Add New User
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new application user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
          <DialogFooter className="pt-4">
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
      </DialogContent>
    </Dialog>
  );
}
    